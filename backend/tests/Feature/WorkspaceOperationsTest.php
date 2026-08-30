<?php

namespace Tests\Feature;

use App\Enums\ApprovalStatus;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_my_tasks_only_returns_visible_assignments_for_current_user(): void
    {
        $admin = $this->superAdmin();
        $assigned = Task::factory()->create(['assignee_id' => $admin->id, 'title' => 'My urgent task']);
        Task::factory()->create(['assignee_id' => User::factory()->create()->id, 'title' => 'Other task']);
        $this->loginAs($admin);

        $this->getJson('/api/my-tasks?search=urgent')
            ->assertOk()
            ->assertJsonPath('data.0.id', $assigned->id)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.project.id', $assigned->project_id);
    }

    public function test_my_tasks_requires_task_view_permission(): void
    {
        $user = User::factory()->create();
        $this->loginAs($user);

        $this->getJson('/api/my-tasks')->assertForbidden();
    }

    public function test_approval_queue_returns_only_pending_reviews_and_requires_permission(): void
    {
        $admin = $this->superAdmin();
        $pendingTask = Task::factory()->create(['status' => 'review', 'version' => 2]);
        $pending = $pendingTask->approvals()->create([
            'status' => ApprovalStatus::PENDING,
            'requested_by' => $admin->id,
        ]);
        $resolvedTask = Task::factory()->create(['status' => 'done']);
        $resolvedTask->approvals()->create([
            'status' => ApprovalStatus::APPROVED,
            'requested_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);
        $this->loginAs($admin);

        $this->getJson('/api/approvals')
            ->assertOk()
            ->assertJsonPath('data.0.id', $pending->id)
            ->assertJsonPath('data.0.task.id', $pendingTask->id)
            ->assertJsonCount(1, 'data');
    }

    public function test_approval_queue_requires_task_approve_permission(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $this->loginAs($user);

        $this->getJson('/api/approvals')->assertForbidden();
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
