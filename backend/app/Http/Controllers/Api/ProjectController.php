<?php

namespace App\Http\Controllers\Api;

use App\Actions\WriteAuditLog;
use App\Enums\ProjectRole;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\IndexProjectRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(IndexProjectRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);
        $data = $request->validated();
        $user = $request->user();

        $projects = Project::query()
            ->select('projects.*')
            ->with(['manager', 'creator', 'team'])
            ->withCount('projectMembers')
            ->withCount('tasks')
            ->withCount(['tasks as done_tasks_count' => fn (Builder $query) => $query->where('status', TaskStatus::DONE->value)])
            ->when(! $user->isSuperAdmin(), function (Builder $query) use ($user) {
                $query->where(function (Builder $query) use ($user) {
                    $query->where('project_manager_id', $user->id)
                        ->orWhere('created_by', $user->id)
                        ->orWhereHas('projectMembers', fn (Builder $query) => $query->where('user_id', $user->id));
                });
            })
            ->when($data['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($data['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->orderBy($data['sort'] ?? 'created_at', $data['direction'] ?? 'desc')
            ->paginate($data['per_page'] ?? 15)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Daftar project berhasil dimuat.',
            'data' => ProjectResource::collection($projects->getCollection())->resolve(),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'from' => $projects->firstItem(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'to' => $projects->lastItem(),
                'total' => $projects->total(),
                'path' => $projects->path(),
                'links' => $projects->linkCollection()->values()->all(),
            ],
        ]);
    }

    public function store(StoreProjectRequest $request, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('create', Project::class);
        $data = $request->validated();

        $project = DB::transaction(function () use ($request, $data) {
            $managerId = $data['project_manager_id'] ?? ($request->user()->isSuperAdmin() ? null : $request->user()->id);
            $project = Project::create([
                ...Arr::only($data, ['name', 'description', 'status', 'priority', 'start_date', 'deadline', 'team_id']),
                'project_manager_id' => $managerId,
                'created_by' => $request->user()->id,
            ]);

            if ($project->project_manager_id) {
                $project->projectMembers()->updateOrCreate(
                    ['user_id' => $project->project_manager_id],
                    ['project_role' => ProjectRole::MANAGER, 'joined_at' => now()],
                );
            }

            return $project;
        });

        $audit->handle($request, 'PROJECT_CREATED', $project, null, $project->only(['name', 'status', 'priority', 'team_id', 'project_manager_id', 'deadline']));

        return response()->json([
            'success' => true,
            'message' => 'Project berhasil dibuat.',
            'data' => new ProjectResource($this->loadProject($project)),
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'message' => 'Project berhasil dimuat.',
            'data' => new ProjectResource($this->loadProject($project, true)),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('update', $project);
        $old = $project->only(['name', 'description', 'status', 'priority', 'team_id', 'start_date', 'deadline', 'project_manager_id']);
        $data = $request->validated();

        DB::transaction(function () use ($project, $data) {
            $project->update(Arr::only($data, ['name', 'description', 'status', 'priority', 'team_id', 'start_date', 'deadline', 'project_manager_id']));

            if (array_key_exists('project_manager_id', $data)) {
                $project->projectMembers()
                    ->where('project_role', ProjectRole::MANAGER->value)
                    ->when($data['project_manager_id'], fn (Builder $query, int $managerId) => $query->where('user_id', '!=', $managerId))
                    ->update(['project_role' => ProjectRole::MEMBER->value]);

                if ($data['project_manager_id']) {
                    $project->projectMembers()->updateOrCreate(
                        ['user_id' => $data['project_manager_id']],
                        ['project_role' => ProjectRole::MANAGER, 'joined_at' => now()],
                    );
                }
            }
        });

        $project->refresh();
        $audit->handle($request, 'PROJECT_UPDATED', $project, $old, $project->only(array_keys($old)));

        return response()->json([
            'success' => true,
            'message' => 'Project berhasil diperbarui.',
            'data' => new ProjectResource($this->loadProject($project)),
        ]);
    }

    public function destroy(Request $request, Project $project, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('delete', $project);
        $old = $project->only(['name', 'status', 'priority', 'team_id', 'project_manager_id', 'deadline']);
        $audit->handle($request, 'PROJECT_DELETED', $project, $old, null);
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project berhasil dihapus.',
            'data' => null,
        ]);
    }

    private function loadProject(Project $project, bool $withMembers = false): Project
    {
        $project->load(['manager', 'creator', 'team']);
        if ($withMembers) {
            $project->load('members');
        }

        return $project
            ->loadCount('projectMembers')
            ->loadCount('tasks')
            ->loadCount(['tasks as done_tasks_count' => fn (Builder $query) => $query->where('status', TaskStatus::DONE->value)]);
    }
}
