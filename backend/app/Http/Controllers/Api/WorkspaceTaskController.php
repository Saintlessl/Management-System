<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Task\IndexWorkspaceTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Support\VisibleProjectScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class WorkspaceTaskController extends Controller
{
    public function index(IndexWorkspaceTaskRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $tasks = Task::query()
            ->where('assignee_id', $user->id)
            ->whereHas('project', fn (Builder $project) => VisibleProjectScope::apply($project, $user))
            ->with(['project:id,name,status', 'assignee', 'reporter', 'labels', 'dependencies'])
            ->withCount(['subtasks', 'comments', 'attachments'])
            ->when($data['search'] ?? null, fn (Builder $query, string $search) => $query
                ->where(fn (Builder $query) => $query
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('project', fn (Builder $project) => $project->where('name', 'like', "%{$search}%"))))
            ->when($data['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($data['priority'] ?? null, fn (Builder $query, string $priority) => $query->where('priority', $priority))
            ->when($data['project_id'] ?? null, fn (Builder $query, int $projectId) => $query->where('project_id', $projectId))
            ->when(($data['deadline'] ?? null) === 'overdue', fn (Builder $query) => $query
                ->whereDate('deadline', '<', today())
                ->where('status', '!=', TaskStatus::DONE))
            ->when(($data['deadline'] ?? null) === 'next_7_days', fn (Builder $query) => $query
                ->whereBetween('deadline', [today(), today()->addDays(7)])
                ->where('status', '!=', TaskStatus::DONE))
            ->when(($data['deadline'] ?? null) === 'none', fn (Builder $query) => $query->whereNull('deadline'))
            ->orderBy($data['sort'] ?? 'deadline', $data['direction'] ?? 'asc')
            ->orderBy('id')
            ->paginate($data['per_page'] ?? 20)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tugas saya berhasil dimuat.',
            'data' => TaskResource::collection($tasks->getCollection())->resolve(),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'from' => $tasks->firstItem(),
                'last_page' => $tasks->lastPage(),
                'per_page' => $tasks->perPage(),
                'to' => $tasks->lastItem(),
                'total' => $tasks->total(),
                'path' => $tasks->path(),
                'links' => $tasks->linkCollection()->values()->all(),
            ],
        ]);
    }
}
