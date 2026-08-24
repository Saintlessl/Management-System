<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'task_id' => $this->task_id, 'uploaded_by' => $this->uploaded_by, 'original_name' => $this->original_name, 'mime_type' => $this->mime_type, 'size' => $this->size, 'human_size' => number_format($this->size / 1024, 1).' KB', 'uploader' => new UserResource($this->whenLoaded('uploader')), 'created_at' => $this->created_at?->toISOString()];
    }
}
