<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Task> */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => TaskStatus::BACKLOG,
            'priority' => TaskPriority::MEDIUM,
            'assignee_id' => null,
            'reporter_id' => User::factory(),
            'parent_task_id' => null,
            'deadline' => today()->addWeek(),
            'position' => 1,
            'version' => 1,
        ];
    }
}
