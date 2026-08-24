<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'task_id' => $this->task_id, 'user_id' => $this->user_id, 'parent_id' => $this->parent_id, 'body' => $this->body, 'user' => new UserResource($this->whenLoaded('user')), 'replies' => self::collection($this->whenLoaded('replies')), 'created_at' => $this->created_at?->toISOString(), 'updated_at' => $this->updated_at?->toISOString()];
    }
}
