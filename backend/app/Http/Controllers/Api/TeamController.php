<?php

namespace App\Http\Controllers\Api;

use App\Actions\WriteAuditLog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Requests\Team\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\JsonResponse;

class TeamController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Team::class);

        $teams = Team::query()
            ->with('creator')
            ->withCount(['teamMembers', 'projects'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tim berhasil dimuat.',
            'data' => TeamResource::collection($teams->getCollection())->resolve(),
            'meta' => [
                'current_page' => $teams->currentPage(),
                'from' => $teams->firstItem(),
                'last_page' => $teams->lastPage(),
                'per_page' => $teams->perPage(),
                'to' => $teams->lastItem(),
                'total' => $teams->total(),
                'path' => $teams->path(),
                'links' => $teams->linkCollection()->values()->all(),
            ],
        ]);
    }

    public function store(StoreTeamRequest $request, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('create', Team::class);
        $team = Team::create([...$request->validated(), 'created_by' => $request->user()->id]);
        $audit->handle($request, 'TEAM_CREATED', $team, null, $team->only(['name', 'description', 'created_by']));

        return response()->json([
            'success' => true,
            'message' => 'Tim berhasil dibuat.',
            'data' => new TeamResource($this->loadTeam($team)),
        ], 201);
    }

    public function show(Team $team): JsonResponse
    {
        $this->authorize('view', $team);

        return response()->json([
            'success' => true,
            'message' => 'Tim berhasil dimuat.',
            'data' => new TeamResource($this->loadTeam($team, true)),
        ]);
    }

    public function update(UpdateTeamRequest $request, Team $team, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('update', $team);
        $old = $team->only(['name', 'description']);
        $team->update($request->validated());
        $audit->handle($request, 'TEAM_UPDATED', $team, $old, $team->only(array_keys($old)));

        return response()->json([
            'success' => true,
            'message' => 'Tim berhasil diperbarui.',
            'data' => new TeamResource($this->loadTeam($team)),
        ]);
    }

    public function destroy(UpdateTeamRequest $request, Team $team, WriteAuditLog $audit): JsonResponse
    {
        $this->authorize('delete', $team);
        $old = $team->only(['name', 'description']);
        $audit->handle($request, 'TEAM_DELETED', $team, $old);
        $team->delete();

        return response()->json(['success' => true, 'message' => 'Tim berhasil dihapus.', 'data' => null]);
    }

    private function loadTeam(Team $team, bool $withMembers = false): Team
    {
        $team->load('creator');
        if ($withMembers) {
            $team->load('members');
        }

        return $team->loadCount(['teamMembers', 'projects']);
    }
}
