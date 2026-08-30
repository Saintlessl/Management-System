<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApprovalStatus;
use App\Enums\TaskPriority;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApprovalQueueResource;
use App\Models\Approval;
use App\Support\VisibleProjectScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ApprovalQueueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasPermission('task.approve') || $user->isSuperAdmin(), 403);

        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::enum(TaskPriority::class)],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $items = Approval::query()
            ->where('status', ApprovalStatus::PENDING)
            ->whereHas('task', function (Builder $tasks) use ($user) {
                VisibleProjectScope::actionableTasks($tasks, $user);
                $tasks->whereHas('project', fn (Builder $projects) => VisibleProjectScope::apply($projects, $user));
            })
            ->with(['requester', 'task.project:id,name', 'task.assignee'])
            ->when($data['search'] ?? null, fn (Builder $query, string $search) => $query
                ->whereHas('task', fn (Builder $tasks) => $tasks
                    ->where(fn (Builder $tasks) => $tasks
                        ->where('title', 'like', "%{$search}%")
                        ->orWhereHas('project', fn (Builder $projects) => $projects->where('name', 'like', "%{$search}%")))))
            ->when($data['priority'] ?? null, fn (Builder $query, string $priority) => $query
                ->whereHas('task', fn (Builder $tasks) => $tasks->where('priority', $priority)))
            ->when($data['project_id'] ?? null, fn (Builder $query, int $projectId) => $query
                ->whereHas('task', fn (Builder $tasks) => $tasks->where('project_id', $projectId)))
            ->latest('id')
            ->paginate($data['per_page'] ?? 20)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Antrean persetujuan berhasil dimuat.',
            'data' => ApprovalQueueResource::collection($items->getCollection())->resolve(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'from' => $items->firstItem(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'to' => $items->lastItem(),
                'total' => $items->total(),
                'path' => $items->path(),
                'links' => $items->linkCollection()->values()->all(),
            ],
        ]);
    }
}
