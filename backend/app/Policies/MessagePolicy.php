<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function update(User $user, Message $message): bool
    {
        return $this->participatesInConversation($user, $message)
            && $user->hasPermission('chat.send')
            && $message->user_id === $user->id;
    }

    public function delete(User $user, Message $message): bool
    {
        if (! $this->participatesInConversation($user, $message)) {
            return false;
        }

        if ($user->hasPermission('chat.manage')) {
            return true;
        }

        return $user->hasPermission('chat.send')
            && $message->user_id === $user->id;
    }

    private function participatesInConversation(User $user, Message $message): bool
    {
        return $message->conversation->participants()->where('user_id', $user->id)->exists();
    }
}
