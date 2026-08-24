<?php

namespace App\Policies;

use App\Enums\ProjectRole;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function view(User $user, Task $task): bool
    {
        return $user->hasPermission('task.view') && $this->belongsToProject($user, $task);
    }

    public function create(User $user, Task $task): bool
    {
        return $user->hasPermission('task.create') && $this->managesProject($user, $task);
    }

    public function update(User $user, Task $task): bool
    {
        if (! $user->hasPermission('task.update') || ! $this->belongsToProject($user, $task)) {
            return false;
        }

        return $this->managesProject($user, $task) || $task->assignee_id === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->hasPermission('task.delete') && $this->managesProject($user, $task);
    }

    public function manage(User $user, Task $task): bool
    {
        return $user->hasPermission('task.update') && $this->managesProject($user, $task);
    }

    public function assign(User $user, Task $task): bool
    {
        return $user->hasPermission('task.assign') && $this->managesProject($user, $task);
    }

    public function move(User $user, Task $task): bool
    {
        return $user->hasPermission('task.move')
            && $this->belongsToProject($user, $task)
            && ($this->managesProject($user, $task) || $task->assignee_id === $user->id);
    }

    private function belongsToProject(User $user, Task $task): bool
    {
        $project = $task->project;

        return $project->project_manager_id === $user->id
            || $project->created_by === $user->id
            || $project->projectMembers()->where('user_id', $user->id)->exists();
    }

    private function managesProject(User $user, Task $task): bool
    {
        $project = $task->project;

        return $project->project_manager_id === $user->id
            || $project->projectMembers()
                ->where('user_id', $user->id)
                ->where('project_role', ProjectRole::MANAGER->value)
                ->exists();
    }
}
