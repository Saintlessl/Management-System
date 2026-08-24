<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TaskWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_move_reorders_columns_and_increments_version(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $first = Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog', 'position' => 1]);
        $second = Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog', 'position' => 2]);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'todo', 'position' => 1]);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$first->id}/move", ['status' => 'todo', 'position' => 1, 'version' => 1])
            ->assertOk()
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.position', 1);

        $this->assertSame(1, $second->fresh()->position);
    }

    public function test_same_column_move_reorders_without_duplicate_positions(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $first = Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog', 'position' => 1]);
        $second = Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog', 'position' => 2]);
        $third = Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog', 'position' => 3]);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$third->id}/move", ['status' => 'backlog', 'position' => 1, 'version' => 1])->assertOk();

        $this->assertSame(2, $first->fresh()->position);
        $this->assertSame(3, $second->fresh()->position);
        $this->assertSame(1, $third->fresh()->position);
    }

    public function test_same_column_move_beyond_end_clamps_to_last_position_without_gap(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $first = Task::factory()->create(['project_id' => $project->id, 'status' => 'todo', 'position' => 1]);
        $second = Task::factory()->create(['project_id' => $project->id, 'status' => 'todo', 'position' => 2]);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$first->id}/move", [
            'status' => 'todo',
            'position' => 999,
            'version' => 1,
        ])->assertOk()->assertJsonPath('data.position', 2);

        $this->assertSame([1, 2], Task::query()->where('project_id', $project->id)->where('status', 'todo')->orderBy('position')->pluck('position')->all());
        $this->assertSame(1, $second->fresh()->position);
    }

    public function test_kanban_cannot_bypass_approval_to_done(): void
    {
        $admin = $this->superAdmin();
        $task = Task::factory()->create(['status' => 'review']);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$task->id}/move", ['status' => 'done', 'position' => 1, 'version' => 1])
            ->assertConflict();
    }

    public function test_stale_move_is_rejected(): void
    {
        $admin = $this->superAdmin();
        $task = Task::factory()->create(['version' => 2]);
        $this->loginAs($admin);

        $this->patchJson("/api/tasks/{$task->id}/move", ['status' => 'todo', 'position' => 1, 'version' => 1])
            ->assertConflict();
    }

    public function test_submit_and_approve_creates_immutable_history_and_done_task(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'status' => 'in_progress', 'version' => 1]);
        $this->loginAs($admin);

        $this->postJson("/api/tasks/{$task->id}/submit-review", ['version' => 1, 'comment' => 'Ready'])
            ->assertOk()->assertJsonPath('data.status', 'review');
        $this->postJson("/api/tasks/{$task->id}/approve", ['version' => 2, 'comment' => 'Approved'])
            ->assertOk()->assertJsonPath('data.status', 'done');

        $approval = Approval::firstOrFail();
        $this->assertSame('approved', $approval->status->value);
        $this->assertSame(['submitted', 'approved'], $approval->histories()->orderBy('id')->pluck('action')->all());
        $this->assertDatabaseHas('audit_logs', ['action' => 'TASK_APPROVAL_CHANGED']);
        $this->getJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.approvals.0.status', 'approved')
            ->assertJsonPath('data.approvals.0.histories.0.action', 'submitted')
            ->assertJsonPath('data.approvals.0.histories.1.action', 'approved');
    }

    public function test_revision_returns_task_to_in_progress(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $task = Task::factory()->create(['status' => 'review', 'version' => 2]);
        $task->approvals()->create(['status' => 'pending', 'requested_by' => $task->reporter_id]);
        $this->loginAs($admin);

        $this->postJson("/api/tasks/{$task->id}/request-revision", ['version' => 2, 'comment' => 'Please revise'])
            ->assertOk()->assertJsonPath('data.status', 'in_progress');
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
