<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'body' => $this->body,
            'parent_id' => $this->parent_id,
            'edited_at' => $this->edited_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'user' => new UserResource($this->whenLoaded('user')),
            'parent' => new MessageResource($this->whenLoaded('parent')),
            'reactions' => MessageReactionResource::collection($this->whenLoaded('reactions')),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'replies_count' => $this->whenCounted('replies'),
        ];
    }
}
