<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'message_id' => $this->message_id,
            'uploaded_by' => $this->uploaded_by,
            'original_name' => $this->original_name,
            'stored_name' => $this->stored_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'human_size' => $this->human_size,
            'path' => $this->path,
            'created_at' => $this->created_at?->toISOString(),
            'uploader' => new UserResource($this->whenLoaded('uploader')),
        ];
    }
}
