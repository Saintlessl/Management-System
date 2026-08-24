<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Validation\ValidationException;

class TaskRules
{
    public function validateRelations(Project $project, array $data, ?Task $task = null): void
    {
        if (! empty($data['assignee_id']) && ! $project->projectMembers()->where('user_id', $data['assignee_id'])->exists()) {
            throw ValidationException::withMessages(['assignee_id' => ['Assignee harus menjadi anggota project.']]);
        }

        if (! empty($data['parent_task_id'])) {
            $parent = Task::find($data['parent_task_id']);
            if (! $parent || $parent->project_id !== $project->id || $parent->is($task)) {
                throw ValidationException::withMessages(['parent_task_id' => ['Parent task harus berbeda dan berada pada project yang sama.']]);
            }
        }

        if (isset($data['label_ids'])) {
            $validCount = $project->labels()->whereIn('id', $data['label_ids'])->count();
            if ($validCount !== count($data['label_ids'])) {
                throw ValidationException::withMessages(['label_ids' => ['Semua label harus berasal dari project yang sama.']]);
            }
        }

        if (isset($data['dependency_ids'])) {
            $dependencies = Task::query()->whereIn('id', $data['dependency_ids'])->get();
            if ($dependencies->count() !== count($data['dependency_ids']) || $dependencies->contains(fn (Task $dependency) => $dependency->project_id !== $project->id || $dependency->is($task))) {
                throw ValidationException::withMessages(['dependency_ids' => ['Dependency harus berbeda dan berada pada project yang sama.']]);
            }

            if ($task && $dependencies->contains(fn (Task $dependency) => $this->reaches($dependency, $task->id))) {
                throw ValidationException::withMessages(['dependency_ids' => ['Dependency akan membuat siklus.']]);
            }
        }
    }

    public function validateTransition(Task $task, TaskStatus $target): void
    {
        if ($task->status === $target) {
            return;
        }

        if (! $task->status->canTransitionTo($target)) {
            throw ValidationException::withMessages(['status' => ["Transisi {$task->status->value} ke {$target->value} tidak diizinkan."]]);
        }

        if ($target === TaskStatus::DONE && $task->hasUnresolvedDependencies()) {
            throw ValidationException::withMessages([
                'dependencies' => $task->dependencies()->where('status', '!=', TaskStatus::DONE->value)->pluck('title')->all(),
            ]);
        }
    }

    private function reaches(Task $task, int $targetId, array $visited = []): bool
    {
        if ($task->id === $targetId) {
            return true;
        }
        if (in_array($task->id, $visited, true)) {
            return false;
        }

        $visited[] = $task->id;

        return $task->dependencies->contains(fn (Task $dependency) => $this->reaches($dependency, $targetId, $visited));
    }
}
