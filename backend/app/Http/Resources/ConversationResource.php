<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();
        $unreadCount = $this->resource->getUnreadCountFor($currentUser);

        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name,
            'team_id' => $this->team_id,
            'project_id' => $this->project_id,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'unread_count' => $unreadCount,
            'last_message' => new MessageResource($this->whenLoaded('latestMessage')),
            'participants' => UserResource::collection($this->whenLoaded('participants')),
            'team' => new TeamResource($this->whenLoaded('team')),
            'project' => new ProjectResource($this->whenLoaded('project')),
        ];
    }
}
