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

class ProjectCompletionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_manager_can_submit_completed_project_for_approval(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'done']);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/submit-completion")
            ->assertOk();

        $this->assertDatabaseHas('project_approvals', [
            'project_id' => $project->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PROJECT_COMPLETION_SUBMITTED']);
    }

    public function test_cannot_submit_completion_when_tasks_are_pending(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'in_progress']);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/submit-completion")
            ->assertStatus(409);
    }

    public function test_cannot_submit_completion_when_task_has_pending_approval(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'status' => 'done']);
        $task->approvals()->create(['status' => 'pending', 'requested_by' => $admin->id]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/submit-completion")
            ->assertStatus(409);
    }

    public function test_admin_can_approve_project_completion(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id, 'status' => 'active']);
        $project->approvals()->create(['status' => 'pending', 'requested_by' => $admin->id]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/approve-completion", ['comment' => 'Looks good'])
            ->assertOk();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'status' => 'completed']);
        $this->assertNotNull($project->fresh()->completed_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PROJECT_COMPLETION_APPROVAL_CHANGED']);
    }

    public function test_revision_request_resets_project_to_active(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id, 'status' => 'active']);
        $project->approvals()->create(['status' => 'pending', 'requested_by' => $admin->id]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/request-completion-revision", ['comment' => 'Needs more work'])
            ->assertOk();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'status' => 'active', 'completed_at' => null]);
    }

    public function test_revision_without_comment_is_rejected(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id, 'status' => 'active']);
        $project->approvals()->create(['status' => 'pending', 'requested_by' => $admin->id]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/request-completion-revision")
            ->assertStatus(422);
    }

    public function test_cannot_approve_without_pending_approval(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/approve-completion")
            ->assertStatus(409);
    }

    public function test_completion_approval_creates_immutable_history(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        $approval = $project->approvals()->create(['status' => 'pending', 'requested_by' => $admin->id]);
        $approval->histories()->create(['user_id' => $admin->id, 'action' => 'submitted']);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/approve-completion", ['comment' => 'Done']);
        $this->postJson("/api/projects/{$project->id}/submit-completion")->assertStatus(409);

        $approval = $project->approvals()->latest()->first();
        $this->assertSame(['submitted', 'approved'], $approval->histories()->orderBy('id')->pluck('action')->all());
    }

    public function test_unrelated_user_cannot_submit_project_completion(): void
    {
        $perm = \App\Models\Permission::create(['name' => 'Project Submit Completion', 'slug' => 'project.submit_completion', 'group' => 'Projects']);
        $role = Role::create(['name' => 'Member', 'slug' => 'member']);
        $role->permissions()->attach($perm->id);
        $user = User::factory()->create();
        $user->roles()->attach($role);
        $project = Project::factory()->create();
        $this->loginAs($user);

        $this->postJson("/api/projects/{$project->id}/submit-completion")
            ->assertForbidden();
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
