<?php

namespace App\Http\Resources;

use App\Enums\ProjectStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tasksCount = (int) ($this->tasks_count ?? 0);
        $doneTasksCount = (int) ($this->done_tasks_count ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status?->value ?? 'planning',
            'priority' => $this->priority?->value ?? 'medium',
            'start_date' => $this->start_date?->toDateString(),
            'deadline' => $this->deadline?->toDateString(),
            'project_manager_id' => $this->project_manager_id,
            'team_id' => $this->team_id,
            'created_by' => $this->created_by,
            'manager' => new UserResource($this->whenLoaded('manager')),
            'team' => new TeamResource($this->whenLoaded('team')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'members' => UserResource::collection($this->whenLoaded('members')),
            'members_count' => $this->whenCounted('projectMembers'),
            'tasks_count' => $tasksCount,
            'done_tasks_count' => $doneTasksCount,
            'progress' => $tasksCount > 0 ? round(($doneTasksCount / $tasksCount) * 100, 1) : 0,
            'is_overdue' => $this->deadline?->isPast()
                && ! in_array($this->status, [ProjectStatus::COMPLETED, ProjectStatus::CANCELLED], true),
            'completion_submitted_at' => $this->completion_submitted_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
