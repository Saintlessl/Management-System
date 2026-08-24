<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'user_id' => $this->user_id,
            'project_role' => $this->project_role->value,
            'joined_at' => $this->joined_at?->toISOString(),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
