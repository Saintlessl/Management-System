<?php

namespace App\Actions;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class InvalidateDashboardCache
{
    public function forProject(Project $project): void
    {
        User::query()
            ->where(function ($query) use ($project) {
                $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('slug', 'super-admin'))
                    ->when($project->project_manager_id, fn ($userQuery, int $managerId) => $userQuery->orWhere('id', $managerId))
                    ->orWhereHas('projectMemberships', fn ($membershipQuery) => $membershipQuery->where('project_id', $project->id));
            })
            ->pluck('id')
            ->each(fn (int $userId) => Cache::forget("dashboard:user:{$userId}"));
    }

    public function forUser(User $user): void
    {
        Cache::forget("dashboard:user:{$user->id}");
    }
}
