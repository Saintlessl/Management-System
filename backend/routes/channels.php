<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{id}', function ($user, $id) {
    return $user->conversations()->where('conversation_id', $id)->exists();
});

Broadcast::channel('presence-conversation.{id}', function ($user, $id) {
    return $user->conversations()->where('conversation_id', $id)->exists();
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return $user->id === (int) $id;
});
