<?php

namespace App\Http\Controllers\Api;

use App\Actions\InvalidateDashboardCache;
use App\Actions\WriteAuditLog;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Task\IndexTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use App\Notifications\TaskAssignedNotification;
use App\Services\TaskRules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index(IndexTaskRequest $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $data = $request->validated();

        $tasks = $project->tasks()
            ->with(['assignee', 'reporter', 'labels', 'dependencies'])
            ->withCount(['subtasks', 'comments', 'attachments'])
            ->when($data['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $query) => $query->where('title', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%")))
            ->when($data['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($data['priority'] ?? null, fn (Builder $query, string $priority) => $query->where('priority', $priority))
            ->when($data['assignee_id'] ?? null, fn (Builder $query, int $assignee) => $query->where('assignee_id', $assignee))
            ->when($data['deadline'] ?? null, fn (Builder $query, string $deadline) => $query->whereDate('deadline', $deadline))
            ->when($data['label_id'] ?? null, fn (Builder $query, int $label) => $query->whereHas('labels', fn (Builder $query) => $query->whereKey($label)))
            ->orderBy($data['sort'] ?? 'created_at', $data['direction'] ?? 'desc')
            ->paginate($data['per_page'] ?? 20)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Daftar task berhasil dimuat.',
            'data' => TaskResource::collection($tasks->getCollection())->resolve(),
            'meta' => [
                'current_page' => $tasks->currentPage(), 'from' => $tasks->firstItem(), 'last_page' => $tasks->lastPage(),
                'per_page' => $tasks->perPage(), 'to' => $tasks->lastItem(), 'total' => $tasks->total(),
                'path' => $tasks->path(), 'links' => $tasks->linkCollection()->values()->all(),
            ],
        ]);
    }

    public function store(StoreTaskRequest $request, Project $project, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        $prototype = new Task(['project_id' => $project->id]);
        $prototype->setRelation('project', $project);
        $this->authorize('create', $prototype);
        $data = $request->validated();
        abort_if(
            isset($data['status']) && in_array(TaskStatus::from($data['status']), [TaskStatus::REVIEW, TaskStatus::DONE], true),
            409,
            'Task baru tidak dapat dibuat langsung pada status review atau done.',
        );
        $rules->validateRelations($project, $data);

        $task = DB::transaction(function () use ($request, $project, $data) {
            $position = ((int) $project->tasks()->where('status', $data['status'] ?? TaskStatus::BACKLOG->value)->max('position')) + 1;
            $task = $project->tasks()->create([
                ...Arr::only($data, ['title', 'description', 'assignee_id', 'parent_task_id', 'deadline']),
                'status' => $data['status'] ?? TaskStatus::BACKLOG->value,
                'priority' => $data['priority'] ?? 'medium',
                'reporter_id' => $request->user()->id,
                'position' => $position,
                'version' => 1,
            ]);
            $task->labels()->sync($data['label_ids'] ?? []);
            $task->dependencies()->sync($data['dependency_ids'] ?? []);

            return $task;
        });

        $audit->handle($request, 'TASK_CREATED', $task, null, $task->only(['project_id', 'title', 'status', 'priority', 'assignee_id', 'deadline']));
        if ($task->assignee) {
            $task->assignee->notify(new TaskAssignedNotification($task));
        }
        $dashboard->forProject($project);

        return response()->json(['success' => true, 'message' => 'Task berhasil dibuat.', 'data' => new TaskResource($this->loadTask($task))], 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return response()->json(['success' => true, 'message' => 'Task berhasil dimuat.', 'data' => new TaskResource($this->loadTask($task, true))]);
    }

    public function update(UpdateTaskRequest $request, Task $task, TaskRules $rules, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        $this->authorize('update', $task);
        $data = $request->validated();

        if ((int) $data['version'] !== $task->version) {
            return response()->json(['success' => false, 'message' => 'Task telah diubah oleh pengguna lain. Muat ulang data.', 'data' => null], 409);
        }

        if (array_key_exists('assignee_id', $data)) {
            $this->authorize('assign', $task);
        }

        $managerialFields = ['title', 'priority', 'assignee_id', 'parent_task_id', 'deadline', 'label_ids', 'dependency_ids'];
        if (array_intersect(array_keys($data), $managerialFields)) {
            $this->authorize('manage', $task);
        }

        $rules->validateRelations($task->project, $data, $task);
        if (isset($data['status']) && TaskStatus::from($data['status']) !== $task->status) {
            abort(409, 'Gunakan endpoint move atau workflow untuk mengubah status task.');
        }
        $old = $task->only(['title', 'description', 'status', 'priority', 'assignee_id', 'parent_task_id', 'deadline', 'version']);
        $oldAssigneeId = $task->assignee_id;

        DB::transaction(function () use ($task, $data) {
            $task->update([
                ...Arr::only($data, ['title', 'description', 'status', 'priority', 'assignee_id', 'parent_task_id', 'deadline']),
                'version' => $task->version + 1,
            ]);
            if (array_key_exists('label_ids', $data)) {
                $task->labels()->sync($data['label_ids']);
            }
            if (array_key_exists('dependency_ids', $data)) {
                $task->dependencies()->sync($data['dependency_ids']);
            }
        });

        $task->refresh();
        $audit->handle($request, 'TASK_UPDATED', $task, $old, $task->only(array_keys($old)));
        if ($task->assignee && $task->assignee_id !== $oldAssigneeId) {
            $task->assignee->notify(new TaskAssignedNotification($task));
        }
        $dashboard->forProject($task->project);

        return response()->json(['success' => true, 'message' => 'Task berhasil diperbarui.', 'data' => new TaskResource($this->loadTask($task))]);
    }

    public function destroy(Request $request, Task $task, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        $this->authorize('delete', $task);
        $project = $task->project;
        $audit->handle($request, 'TASK_DELETED', $task, $task->only(['project_id', 'title', 'status']), null);
        $task->delete();
        $dashboard->forProject($project);

        return response()->json(['success' => true, 'message' => 'Task berhasil dihapus.', 'data' => null]);
    }

    private function loadTask(Task $task, bool $details = false): Task
    {
        $task->load(['assignee', 'reporter', 'labels', 'dependencies']);
        if ($details) {
            $task->load([
                'parentTask',
                'subtasks.assignee',
                'approvals.requester',
                'approvals.reviewer',
                'approvals.histories.user',
            ]);
        }

        return $task->loadCount(['subtasks', 'comments', 'attachments']);
    }
}
