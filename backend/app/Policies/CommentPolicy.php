<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function create(User $user, Task $task): bool
    {
        return $user->hasPermission('comment.create') && $this->access($user, $task);
    }

    public function update(User $user, Comment $comment): bool
    {
        return $user->hasPermission('comment.update') && $comment->user_id === $user->id && $this->access($user, $comment->task);
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $user->hasPermission('comment.delete') && $comment->user_id === $user->id && $this->access($user, $comment->task);
    }

    private function access(User $user, Task $task): bool
    {
        return $task->project->project_manager_id === $user->id || $task->project->created_by === $user->id || $task->project->projectMembers()->where('user_id', $user->id)->exists();
    }
}
