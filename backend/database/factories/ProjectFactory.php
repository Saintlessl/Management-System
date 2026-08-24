<?php

namespace Database\Factories;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Project> */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => ProjectStatus::ACTIVE,
            'start_date' => today(),
            'deadline' => today()->addMonth(),
            'project_manager_id' => null,
            'created_by' => User::factory(),
        ];
    }
}
