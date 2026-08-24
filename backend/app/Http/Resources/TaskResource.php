<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'assignee_id' => $this->assignee_id,
            'reporter_id' => $this->reporter_id,
            'parent_task_id' => $this->parent_task_id,
            'deadline' => $this->deadline?->toDateString(),
            'position' => $this->position,
            'version' => $this->version,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'reporter' => new UserResource($this->whenLoaded('reporter')),
            'parent_task' => new self($this->whenLoaded('parentTask')),
            'subtasks' => self::collection($this->whenLoaded('subtasks')),
            'labels' => $this->whenLoaded('labels'),
            'dependencies' => self::collection($this->whenLoaded('dependencies')),
            'approvals' => $this->whenLoaded('approvals', fn () => $this->approvals->map(fn ($approval) => [
                'id' => $approval->id,
                'status' => $approval->status->value,
                'comment' => $approval->comment,
                'requested_by' => $approval->requested_by,
                'reviewed_by' => $approval->reviewed_by,
                'reviewed_at' => $approval->reviewed_at?->toISOString(),
                'created_at' => $approval->created_at?->toISOString(),
                'requester' => $approval->relationLoaded('requester') ? new UserResource($approval->requester) : null,
                'reviewer' => $approval->relationLoaded('reviewer') && $approval->reviewer ? new UserResource($approval->reviewer) : null,
                'histories' => $approval->relationLoaded('histories') ? $approval->histories->map(fn ($history) => [
                    'id' => $history->id,
                    'action' => $history->action,
                    'comment' => $history->comment,
                    'created_at' => $history->created_at?->toISOString(),
                    'user' => $history->relationLoaded('user') ? new UserResource($history->user) : null,
                ])->values() : [],
            ])->values()),
            'subtasks_count' => $this->whenCounted('subtasks'),
            'comments_count' => $this->whenCounted('comments'),
            'attachments_count' => $this->whenCounted('attachments'),
            'is_overdue' => $this->is_overdue,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
