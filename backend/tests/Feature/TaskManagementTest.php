<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TaskManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_create_task_for_project_member(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $member = User::factory()->create();
        $project->projectMembers()->create(['user_id' => $member->id, 'project_role' => 'member', 'joined_at' => now()]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Build API',
            'assignee_id' => $member->id,
            'priority' => 'high',
        ])->assertCreated()
            ->assertJsonPath('data.assignee.id', $member->id)
            ->assertJsonPath('data.version', 1);

        $this->assertDatabaseHas('audit_logs', ['action' => 'TASK_CREATED']);
        Notification::assertSentTo($member, TaskAssignedNotification::class);
    }

    public function test_task_cannot_be_created_directly_in_review_or_done(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/tasks", ['title' => 'Bypass', 'status' => 'review'])
            ->assertConflict();
        $this->postJson("/api/projects/{$project->id}/tasks", ['title' => 'Bypass', 'status' => 'done'])
            ->assertConflict();
    }

    public function test_assignee_must_belong_to_project(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $outsider = User::factory()->create();
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Invalid assignment',
            'assignee_id' => $outsider->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('assignee_id');
    }

    public function test_cross_project_parent_and_dependency_are_rejected(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $other = Project::factory()->create();
        $otherTask = Task::factory()->create(['project_id' => $other->id]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Cross project',
            'parent_task_id' => $otherTask->id,
            'dependency_ids' => [$otherTask->id],
        ])->assertUnprocessable();
    }

    public function test_direct_status_update_cannot_bypass_kanban_reindexing(): void
    {
        $admin = $this->superAdmin();
        $task = Task::factory()->create(['status' => 'backlog', 'position' => 1]);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$task->id}", [
            'version' => 1,
            'status' => 'todo',
        ])->assertConflict();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'backlog',
            'position' => 1,
            'version' => 1,
        ]);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $admin = $this->superAdmin();
        $task = Task::factory()->create(['status' => 'backlog']);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$task->id}", [
            'version' => 1,
            'status' => 'done',
        ])->assertConflict();
    }

    public function test_unfinished_dependency_blocks_completion(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $dependency = Task::factory()->create(['project_id' => $project->id, 'status' => 'in_progress']);
        $task = Task::factory()->create(['project_id' => $project->id, 'status' => 'review']);
        $task->dependencies()->attach($dependency);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$task->id}", [
            'version' => 1,
            'status' => 'done',
        ])->assertConflict();
    }

    public function test_assigned_member_cannot_change_managerial_task_fields(): void
    {
        $taskUpdate = Permission::create(['name' => 'Task Update', 'slug' => 'task.update', 'group' => 'Tasks']);
        $taskView = Permission::create(['name' => 'Task View', 'slug' => 'task.view', 'group' => 'Tasks']);
        $role = Role::create(['name' => 'Member', 'slug' => 'member']);
        $role->permissions()->sync([$taskUpdate->id, $taskView->id]);
        $member = User::factory()->create();
        $member->roles()->attach($role);
        $project = Project::factory()->create();
        $project->projectMembers()->create(['user_id' => $member->id, 'project_role' => 'member', 'joined_at' => now()]);
        $task = Task::factory()->create(['project_id' => $project->id, 'assignee_id' => $member->id]);
        $this->loginAs($member);

        $this->patchJson("/api/tasks/{$task->id}", ['version' => 1, 'title' => 'Unauthorized change'])
            ->assertForbidden();
        $this->patchJson("/api/tasks/{$task->id}", ['version' => 1, 'description' => 'Allowed progress notes'])
            ->assertOk();
    }

    public function test_stale_task_update_returns_conflict(): void
    {
        $admin = $this->superAdmin();
        $task = Task::factory()->create(['version' => 2]);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$task->id}", ['version' => 1, 'title' => 'Stale'])
            ->assertConflict();
    }

    public function test_circular_dependency_is_rejected(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $first = Task::factory()->create(['project_id' => $project->id]);
        $second = Task::factory()->create(['project_id' => $project->id]);
        $first->dependencies()->attach($second);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$second->id}", [
            'version' => 1,
            'dependency_ids' => [$first->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('dependency_ids');
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
