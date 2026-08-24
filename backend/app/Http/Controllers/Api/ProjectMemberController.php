<?php

namespace App\Http\Controllers\Api;

use App\Actions\WriteAuditLog;
use App\Enums\ProjectRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectMemberRequest;
use App\Http\Resources\ProjectMemberResource;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Notifications\ProjectMemberAddedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectMemberController extends Controller
{
    public function index(Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $members = $project->projectMembers()->with('user.roles')->get()->sortBy('user.name')->values();

        return response()->json([
            'success' => true,
            'message' => 'Daftar anggota project berhasil dimuat.',
            'data' => ProjectMemberResource::collection($members),
        ]);
    }

    public function store(StoreProjectMemberRequest $request, Project $project, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('manageMembers', $project);
        $data = $request->validated();

        if ($project->projectMembers()->where('user_id', $data['user_id'])->exists()) {
            return $this->conflict('Pengguna sudah menjadi anggota project.');
        }

        $member = DB::transaction(function () use ($project, $data) {
            $member = $project->projectMembers()->create([
                ...$data,
                'joined_at' => now(),
            ]);

            if ($data['project_role'] === ProjectRole::MANAGER->value) {
                $project->projectMembers()
                    ->where('project_role', ProjectRole::MANAGER->value)
                    ->where('user_id', '!=', $data['user_id'])
                    ->update(['project_role' => ProjectRole::MEMBER->value]);
                $project->update(['project_manager_id' => $data['user_id']]);
            }

            return $member;
        });

        $audit->handle($request, 'PROJECT_MEMBER_ADDED', $project, null, $data);
        $member->user->notify(new ProjectMemberAddedNotification($project, $data['project_role']));

        return response()->json([
            'success' => true,
            'message' => 'Anggota berhasil ditambahkan.',
            'data' => new ProjectMemberResource($member->load('user.roles')),
        ], 201);
    }

    public function update(StoreProjectMemberRequest $request, Project $project, ProjectMember $member, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('manageMembers', $project);
        abort_unless($member->project_id === $project->id, 404);
        $data = $request->validated();
        abort_unless($member->user_id === $data['user_id'], 422, 'User anggota tidak dapat diganti.');
        $oldRole = $member->project_role->value;

        DB::transaction(function () use ($project, $member, $data) {
            $member->update(['project_role' => $data['project_role']]);
            if ($data['project_role'] === ProjectRole::MANAGER->value) {
                $project->projectMembers()
                    ->where('project_role', ProjectRole::MANAGER->value)
                    ->where('user_id', '!=', $member->user_id)
                    ->update(['project_role' => ProjectRole::MEMBER->value]);
                $project->update(['project_manager_id' => $member->user_id]);
            } elseif ($project->project_manager_id === $member->user_id) {
                $project->update(['project_manager_id' => null]);
            }
        });

        $audit->handle($request, 'PROJECT_MEMBER_ROLE_UPDATED', $project, ['project_role' => $oldRole], ['project_role' => $data['project_role'], 'user_id' => $member->user_id]);

        return response()->json([
            'success' => true,
            'message' => 'Role anggota berhasil diperbarui.',
            'data' => new ProjectMemberResource($member->load('user.roles')),
        ]);
    }

    public function destroy(Request $request, Project $project, ProjectMember $member, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('manageMembers', $project);
        abort_unless($member->project_id === $project->id, 404);

        DB::transaction(function () use ($project, $member) {
            if ($project->project_manager_id === $member->user_id) {
                $project->update(['project_manager_id' => null]);
            }
            $member->delete();
        });

        $audit->handle($request, 'PROJECT_MEMBER_REMOVED', $project, ['user_id' => $member->user_id, 'project_role' => $member->project_role->value], null);

        return response()->json([
            'success' => true,
            'message' => 'Anggota berhasil dihapus.',
            'data' => null,
        ]);
    }

    private function conflict(string $message): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message, 'data' => null], 409);
    }
}
