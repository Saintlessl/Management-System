<?php

namespace App\Http\Controllers\Api;

use App\Actions\InvalidateDashboardCache;
use App\Actions\WriteAuditLog;
use App\Enums\ApprovalStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Approval\ReviewProjectCompletionRequest;
use App\Http\Resources\ProjectApprovalResource;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Notifications\ProjectCompletionWorkflowNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProjectCompletionWorkflowController extends Controller
{
    public function index(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat penyelesaian proyek berhasil dimuat.',
            'data' => ProjectApprovalResource::collection(
                $project->approvals()->with(['requester', 'reviewer', 'histories.user'])->latest()->get(),
            ),
        ]);
    }

    public function submit(ReviewProjectCompletionRequest $request, Project $project, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        $this->authorize('submitCompletion', $project);

        $approval = DB::transaction(function () use ($project, $request) {
            $locked = Project::query()->lockForUpdate()->findOrFail($project->id);
            abort_if($locked->status === ProjectStatus::COMPLETED, 409, 'Proyek sudah diselesaikan.');
            abort_if($locked->approvals()->where('status', ApprovalStatus::PENDING)->exists(), 409, 'Proyek sudah menunggu persetujuan.');
            abort_if($locked->tasks()->where('status', '!=', TaskStatus::DONE->value)->exists(), 409, 'Semua task harus selesai sebelum proyek dapat diajukan.');
            abort_if($locked->tasks()->whereHas('approvals', fn ($query) => $query->where('status', ApprovalStatus::PENDING))->exists(), 409, 'Selesaikan seluruh review task yang masih pending terlebih dahulu.');

            $locked->update(['completion_submitted_at' => now()]);
            $approval = $locked->approvals()->create([
                'status' => ApprovalStatus::PENDING,
                'requested_by' => $request->user()->id,
                'comment' => $request->input('comment'),
            ]);
            $approval->histories()->create([
                'user_id' => $request->user()->id,
                'action' => 'submitted',
                'comment' => $request->input('comment'),
            ]);

            return $approval;
        });

        $project->refresh();
        if ($project->manager && ! $project->manager->is($request->user())) {
            $project->manager->notify(new ProjectCompletionWorkflowNotification($project, 'project_completion_submitted', $request->input('comment')));
        }
        $audit->handle($request, 'PROJECT_COMPLETION_SUBMITTED', $approval, null, ['project_id' => $project->id]);
        $dashboard->forProject($project);

        return $this->response($project, 'Proyek berhasil diajukan untuk persetujuan.');
    }

    public function approve(ReviewProjectCompletionRequest $request, Project $project, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        return $this->review($request, $project, $audit, $dashboard, ApprovalStatus::APPROVED, 'approved', 'Proyek disetujui dan telah selesai.');
    }

    public function revision(ReviewProjectCompletionRequest $request, Project $project, WriteAuditLog $audit, InvalidateDashboardCache $dashboard): JsonResponse
    {
        return $this->review($request, $project, $audit, $dashboard, ApprovalStatus::REVISION_REQUIRED, 'revision_required', 'Revisi proyek diminta.');
    }

    private function review(ReviewProjectCompletionRequest $request, Project $project, WriteAuditLog $audit, InvalidateDashboardCache $dashboard, ApprovalStatus $status, string $action, string $message): JsonResponse
    {
        $this->authorize('approveCompletion', $project);
        abort_if($status === ApprovalStatus::REVISION_REQUIRED && blank($request->input('comment')), 422, 'Catatan revisi wajib diisi.');

        $approval = DB::transaction(function () use ($project, $request, $status, $action) {
            $locked = Project::query()->lockForUpdate()->findOrFail($project->id);
            $approval = $locked->approvals()->where('status', ApprovalStatus::PENDING)->lockForUpdate()->latest()->first();
            abort_unless($approval, 409, 'Tidak ada persetujuan proyek yang menunggu review.');

            $approval->update([
                'status' => $status,
                'reviewed_by' => $request->user()->id,
                'comment' => $request->input('comment'),
                'reviewed_at' => now(),
            ]);
            $approval->histories()->create([
                'user_id' => $request->user()->id,
                'action' => $action,
                'comment' => $request->input('comment'),
            ]);
            $locked->update($status === ApprovalStatus::APPROVED
                ? ['status' => ProjectStatus::COMPLETED, 'completed_at' => now()]
                : ['status' => ProjectStatus::ACTIVE, 'completion_submitted_at' => null, 'completed_at' => null]);

            return $approval;
        });

        $project->refresh();
        $approval->requester->notify(new ProjectCompletionWorkflowNotification($project, $action, $request->input('comment')));
        $audit->handle($request, 'PROJECT_COMPLETION_APPROVAL_CHANGED', $approval, ['status' => 'pending'], ['status' => $status->value, 'project_id' => $project->id]);
        $dashboard->forProject($project);

        return $this->response($project, $message);
    }

    private function response(Project $project, string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => ProjectApprovalResource::collection($project->approvals()->with(['requester', 'reviewer', 'histories.user'])->latest()->get()),
        ]);
    }
}
