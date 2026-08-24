<?php

namespace App\Console\Commands;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Notifications\TaskWorkflowNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SendDeadlineReminders extends Command
{
    protected $signature = 'tasks:send-deadline-reminders';

    protected $description = 'Send due and overdue task reminders without duplicates';

    public function handle(): int
    {
        Task::query()->with(['assignee', 'reporter'])->whereNotNull('deadline')->where('status', '!=', TaskStatus::DONE)->whereDate('deadline', '<=', today()->addDay())->chunkById(100, function ($tasks) {
            foreach ($tasks as $task) {
                $event = $task->deadline->isPast() ? 'task_overdue' : ($task->deadline->isToday() ? 'task_due_today' : 'task_due_tomorrow');
                $recipient = $task->assignee ?? $task->reporter;
                $key = "deadline-reminder:{$event}:{$task->id}:".today()->toDateString();
                if ($recipient && Cache::add($key, true, now()->addDays(3))) {
                    $recipient->notify(new TaskWorkflowNotification($task, $event));
                }
            }
        });

        return self::SUCCESS;
    }
}
