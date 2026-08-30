<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('chat.view');
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return $user->hasPermission('chat.view')
            && $conversation->participants()->where('user_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('chat.create');
    }

    public function send(User $user, Conversation $conversation): bool
    {
        return $user->hasPermission('chat.send')
            && $conversation->participants()->where('user_id', $user->id)->exists();
    }
}
