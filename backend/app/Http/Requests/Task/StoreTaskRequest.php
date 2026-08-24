<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'priority' => ['sometimes', Rule::enum(TaskPriority::class)],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'parent_task_id' => ['nullable', 'integer', 'exists:tasks,id'],
            'deadline' => ['nullable', 'date'],
            'label_ids' => ['sometimes', 'array'],
            'label_ids.*' => ['integer', 'distinct', 'exists:labels,id'],
            'dependency_ids' => ['sometimes', 'array'],
            'dependency_ids.*' => ['integer', 'distinct', 'exists:tasks,id'],
        ];
    }
}
