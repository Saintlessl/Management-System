<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TaskCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public Comment $comment, public string $event = 'comment_created') {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['event' => $this->event, 'comment_id' => $this->comment->id, 'task_id' => $this->comment->task_id, 'project_id' => $this->comment->task->project_id, 'author' => $this->comment->user->name, 'excerpt' => str($this->comment->body)->limit(120)->toString()];
    }
}
