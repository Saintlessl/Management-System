<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\Task;
use App\Models\User;

class AttachmentPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function upload(User $user, Task $task): bool
    {
        return $user->hasPermission('attachment.upload') && $this->access($user, $task);
    }

    public function download(User $user, Attachment $attachment): bool
    {
        return $user->hasPermission('attachment.download') && $this->access($user, $attachment->task);
    }

    public function delete(User $user, Attachment $attachment): bool
    {
        return $attachment->uploaded_by === $user->id && $this->access($user, $attachment->task);
    }

    private function access(User $user, Task $task): bool
    {
        return $task->project->project_manager_id === $user->id || $task->project->created_by === $user->id || $task->project->projectMembers()->where('user_id', $user->id)->exists();
    }
}
