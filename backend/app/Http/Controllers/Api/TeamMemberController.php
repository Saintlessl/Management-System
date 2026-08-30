<?php

namespace App\Http\Controllers\Api;

use App\Actions\WriteAuditLog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamMemberRequest;
use App\Http\Resources\TeamMemberResource;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeamMemberController extends Controller
{
    public function index(Team $team): JsonResponse
    {
        $this->authorize('view', $team);

        return response()->json([
            'success' => true,
            'message' => 'Daftar anggota tim berhasil dimuat.',
            'data' => TeamMemberResource::collection($team->teamMembers()->with('user.roles')->get()->sortBy('user.name')->values()),
        ]);
    }

    public function store(StoreTeamMemberRequest $request, Team $team, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('manageMembers', $team);
        $data = $request->validated();

        if ($team->teamMembers()->where('user_id', $data['user_id'])->exists()) {
            return $this->conflict('Pengguna sudah menjadi anggota tim.');
        }

        $member = $team->teamMembers()->create([...$data, 'joined_at' => now()]);
        $audit->handle($request, 'TEAM_MEMBER_ADDED', $team, null, $data);

        return response()->json([
            'success' => true,
            'message' => 'Anggota berhasil ditambahkan ke tim.',
            'data' => new TeamMemberResource($member->load('user.roles')),
        ], 201);
    }

    public function update(StoreTeamMemberRequest $request, Team $team, TeamMember $member, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('manageMembers', $team);
        abort_unless($member->team_id === $team->id, 404);
        $data = $request->validated();
        abort_unless($member->user_id === $data['user_id'], 422, 'User anggota tidak dapat diganti.');
        $oldRole = $member->team_role;
        $member->update(['team_role' => $data['team_role']]);
        $audit->handle($request, 'TEAM_MEMBER_ROLE_UPDATED', $team, ['team_role' => $oldRole], $data);

        return response()->json([
            'success' => true,
            'message' => 'Role anggota tim berhasil diperbarui.',
            'data' => new TeamMemberResource($member->load('user.roles')),
        ]);
    }

    public function destroy(Request $request, Team $team, TeamMember $member, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('manageMembers', $team);
        abort_unless($member->team_id === $team->id, 404);
        $old = $member->only(['user_id', 'team_role']);
        $member->delete();
        $audit->handle($request, 'TEAM_MEMBER_REMOVED', $team, $old);

        return response()->json(['success' => true, 'message' => 'Anggota berhasil dihapus dari tim.', 'data' => null]);
    }

    private function conflict(string $message): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message, 'data' => null], 409);
    }
}
