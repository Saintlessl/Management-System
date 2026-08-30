<?php

namespace App\Events;

use App\Models\MessageReaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewReactionBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public MessageReaction $reaction) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.'.$this->reaction->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'reaction.new';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->reaction->id,
            'message_id' => $this->reaction->message_id,
            'user_id' => $this->reaction->user_id,
            'emoji' => $this->reaction->emoji,
        ];
    }
}
