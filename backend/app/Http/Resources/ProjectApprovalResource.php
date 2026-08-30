<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectApprovalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'status' => $this->status->value,
            'requested_by' => $this->requested_by,
            'reviewed_by' => $this->reviewed_by,
            'comment' => $this->comment,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'histories' => ProjectApprovalHistoryResource::collection($this->whenLoaded('histories')),
        ];
    }
}
