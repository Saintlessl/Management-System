<?php

namespace App\Support;

use App\Enums\ProjectRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class VisibleProjectScope
{
    /**
     * Limit a project query to projects the user may work inside.
     *
     * This mirrors TaskPolicy::belongsToProject: a creator, project manager, or
     * explicit project member has visibility. Super admins keep the global view.
     */
    public static function apply(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($user) {
            $query->where('created_by', $user->id)
                ->orWhere('project_manager_id', $user->id)
                ->orWhereHas('projectMembers', fn (Builder $members) => $members->where('user_id', $user->id));
        });
    }

    /**
     * Limit a task query to tasks the user can review through the existing
     * TaskPolicy::update rule: managed projects or tasks assigned to the user.
     */
    public static function actionableTasks(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($user) {
            $query->where('assignee_id', $user->id)
                ->orWhereHas('project', function (Builder $project) use ($user) {
                    $project->where('project_manager_id', $user->id)
                        ->orWhereHas('projectMembers', fn (Builder $members) => $members
                            ->where('user_id', $user->id)
                            ->where('project_role', ProjectRole::MANAGER->value));
                });
        });
    }
}
