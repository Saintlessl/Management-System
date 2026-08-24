<?php

namespace App\Policies;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('project.view');
    }

    public function view(User $user, Project $project): bool
    {
        return $user->hasPermission('project.view') && $this->belongsToProject($user, $project);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('project.create');
    }

    public function update(User $user, Project $project): bool
    {
        return $user->hasPermission('project.update') && $this->managesProject($user, $project);
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->hasPermission('project.delete') && $this->managesProject($user, $project);
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $user->hasPermission('project.manage_members') && $this->managesProject($user, $project);
    }

    private function belongsToProject(User $user, Project $project): bool
    {
        return $project->project_manager_id === $user->id
            || $project->created_by === $user->id
            || $project->projectMembers()->where('user_id', $user->id)->exists();
    }

    private function managesProject(User $user, Project $project): bool
    {
        return $project->project_manager_id === $user->id
            || $project->projectMembers()
                ->where('user_id', $user->id)
                ->where('project_role', ProjectRole::MANAGER->value)
                ->exists();
    }
}
