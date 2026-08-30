<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ProjectCompletionWorkflowNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Project $project, public string $event, public ?string $comment = null) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'event' => $this->event,
            'project_id' => $this->project->id,
            'project_name' => $this->project->name,
            'comment' => $this->comment,
        ];
    }
}
