<?php

namespace App\Http\Controllers\Api;

use App\Actions\InvalidateDashboardCache;
use App\Actions\WriteAuditLog;
use App\Enums\ApprovalStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Approval\ReviewTaskRequest;
use App\Http\Requests\Task\MoveTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Notifications\TaskWorkflowNotification;
use App\Services\TaskRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TaskWorkflowController extends Controller
{
    public function move(MoveTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        $this->authorize('move', $task);
        $data = $request->validated();

        if ((int) $data['version'] !== $task->version) {
            return $this->conflict('Task telah diubah oleh pengguna lain. Muat ulang board.');
        }

        $target = TaskStatus::from($data['status']);
        abort_if($target === TaskStatus::DONE, 409, 'Task hanya dapat diselesaikan melalui approval workflow.');
        $rules->validateTransition($task, $target);
        $old = ['status' => $task->status->value, 'position' => $task->position, 'version' => $task->version];

        DB::transaction(function () use ($task, $target, $data) {
            $locked = Task::query()->lockForUpdate()->findOrFail($task->id);
            if ($locked->version !== (int) $data['version']) {
                abort(409, 'Task telah diubah oleh pengguna lain.');
            }

            $sourceStatus = $locked->status->value;
            $sourcePosition = $locked->position;
            $targetCount = Task::query()
                ->where('project_id', $locked->project_id)
                ->where('status', $target->value)
                ->count();
            $maxTargetPosition = $sourceStatus === $target->value
                ? max(1, $targetCount)
                : $targetCount + 1;
            $targetPosition = min((int) $data['position'], $maxTargetPosition);

            if ($sourceStatus === $target->value) {
                if ($targetPosition < $sourcePosition) {
                    Task::query()->where('project_id', $locked->project_id)
                        ->where('status', $sourceStatus)
                        ->whereBetween('position', [$targetPosition, $sourcePosition - 1])
                        ->increment('position');
                } elseif ($targetPosition > $sourcePosition) {
                    Task::query()->where('project_id', $locked->project_id)
                        ->where('status', $sourceStatus)
                        ->whereBetween('position', [$sourcePosition + 1, $targetPosition])
                        ->decrement('position');
                }
            } else {
                Task::query()->where('project_id', $locked->project_id)
                    ->where('status', $sourceStatus)
                    ->where('position', '>', $sourcePosition)
                    ->decrement('position');

                Task::query()->where('project_id', $locked->project_id)
                    ->where('status', $target->value)
                    ->where('position', '>=', $targetPosition)
                    ->increment('position');
            }

            $locked->update([
                'status' => $target,
                'position' => $targetPosition,
                'version' => $locked->version + 1,
            ]);
        });

        $task->refresh();
        $audit->handle($request, 'TASK_MOVED', $task, $old, ['status' => $task->status->value, 'position' => $task->position, 'version' => $task->version]);
        $dashboard->forProject($task->project);

        return response()->json(['success' => true, 'message' => 'Task berhasil dipindahkan.', 'data' => new TaskResource($task->load(['assignee', 'reporter', 'labels', 'dependencies']))]);
    }

    public function submit(ReviewTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        $this->authorize('update', $task);
        abort_unless($request->user()->hasPermission('task.submit_review') || $request->user()->isSuperAdmin(), 403);
        $this->assertVersion($task, $request->integer('version'));
        $rules->validateTransition($task, TaskStatus::REVIEW);

        $approval = DB::transaction(function () use ($request, $task) {
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);
            abort_if($lockedTask->version !== $request->integer('version'), 409, 'Task telah diubah oleh pengguna lain.');
            abort_if($lockedTask->approvals()->where('status', ApprovalStatus::PENDING)->exists(), 409, 'Task sudah memiliki approval pending.');
            $lockedTask->update(['status' => TaskStatus::REVIEW, 'version' => $lockedTask->version + 1]);
            $approval = $lockedTask->approvals()->create([
                'status' => ApprovalStatus::PENDING,
                'requested_by' => $request->user()->id,
                'comment' => $request->input('comment'),
            ]);
            $approval->histories()->create(['user_id' => $request->user()->id, 'action' => 'submitted', 'comment' => $request->input('comment')]);

            return $approval;
        });

        $this->notifyManager($task, 'review_submitted', $request->input('comment'));
        $audit->handle($request, 'TASK_SUBMITTED_FOR_REVIEW', $task, ['status' => 'in_progress'], ['status' => 'review', 'approval_id' => $approval->id]);
        $dashboard->forProject($task->project);

        return $this->taskResponse($task, 'Task berhasil diajukan untuk review.');
    }

    public function approve(ReviewTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        return $this->review($request, $task, $rules, $audit, $dashboard, ApprovalStatus::APPROVED, TaskStatus::DONE, 'approved', 'Task berhasil disetujui.');
    }

    public function reject(ReviewTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        return $this->review($request, $task, $rules, $audit, $dashboard, ApprovalStatus::REJECTED, TaskStatus::IN_PROGRESS, 'rejected', 'Task ditolak dan dikembalikan ke In Progress.');
    }

    public function revision(ReviewTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        return $this->review($request, $task, $rules, $audit, $dashboard, ApprovalStatus::REVISION_REQUIRED, TaskStatus::IN_PROGRESS, 'revision_required', 'Revisi task diminta.');
    }

    private function review(ReviewTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard, ApprovalStatus $approvalStatus, TaskStatus $taskStatus, string $action, string $message): JsonResponse
    {
        abort_unless($request->user()->hasPermission('task.approve') || $request->user()->isSuperAdmin(), 403);
        $this->authorize('update', $task);
        $this->assertVersion($task, $request->integer('version'));
        $rules->validateTransition($task, $taskStatus);
        $approval = DB::transaction(function () use ($request, $task, $approvalStatus, $taskStatus, $action) {
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);
            abort_if($lockedTask->version !== $request->integer('version'), 409, 'Task telah diubah oleh pengguna lain.');
            $approval = $lockedTask->approvals()->where('status', ApprovalStatus::PENDING)->lockForUpdate()->latest()->first();
            abort_unless($approval, 409, 'Tidak ada approval pending untuk task ini.');
            $approval->update([
                'status' => $approvalStatus,
                'reviewed_by' => $request->user()->id,
                'comment' => $request->input('comment'),
                'reviewed_at' => now(),
            ]);
            $approval->histories()->create(['user_id' => $request->user()->id, 'action' => $action, 'comment' => $request->input('comment')]);
            $lockedTask->update(['status' => $taskStatus, 'version' => $lockedTask->version + 1]);

            return $approval;
        });

        $task->reporter->notify(new TaskWorkflowNotification($task, $action, $request->input('comment')));
        if ($task->assignee && ! $task->assignee->is($task->reporter)) {
            $task->assignee->notify(new TaskWorkflowNotification($task, $action, $request->input('comment')));
        }
        $audit->handle($request, 'TASK_APPROVAL_CHANGED', $approval, ['status' => 'pending'], ['status' => $approvalStatus->value, 'task_status' => $taskStatus->value]);
        $dashboard->forProject($task->project);

        return $this->taskResponse($task, $message);
    }

    private function notifyManager(Task $task, string $event, ?string $comment): void
    {
        if ($task->project->manager) {
            $task->project->manager->notify(new TaskWorkflowNotification($task, $event, $comment));
        }
    }

    private function assertVersion(Task $task, int $version): void
    {
        abort_if($task->version !== $version, 409, 'Task telah diubah oleh pengguna lain.');
    }

    private function taskResponse(Task $task, string $message): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $message, 'data' => new TaskResource($task->fresh()->load(['assignee', 'reporter', 'labels', 'dependencies']))]);
    }

    private function conflict(string $message): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message, 'data' => null], 409);
    }
}
