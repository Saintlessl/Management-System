<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalQueueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $task = $this->task;

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toISOString(),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'task' => [
                'id' => $task->id,
                'project_id' => $task->project_id,
                'title' => $task->title,
                'status' => $task->status->value,
                'priority' => $task->priority->value,
                'deadline' => $task->deadline?->toDateString(),
                'version' => $task->version,
                'is_overdue' => $task->is_overdue,
                'project' => $task->relationLoaded('project') ? [
                    'id' => $task->project->id,
                    'name' => $task->project->name,
                ] : null,
                'assignee' => $task->relationLoaded('assignee') && $task->assignee
                    ? new UserResource($task->assignee)
                    : null,
            ],
        ];
    }
}
