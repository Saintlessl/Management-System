<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProjectCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_submit_completion_when_tasks_are_incomplete(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'in_progress']);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/submit-completion")
            ->assertStatus(409);
    }

    public function test_submit_and_approve_sets_completed_at_and_status(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id, 'status' => 'active']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'done']);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/submit-completion")
            ->assertOk()
            ->assertJsonPath('data.0.status', 'pending');

        $this->postJson("/api/projects/{$project->id}/approve-completion", ['comment' => 'All good'])
            ->assertOk()
            ->assertJsonPath('data.0.status', 'approved');

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'status' => 'completed']);
        $this->assertNotNull($project->fresh()->completed_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PROJECT_COMPLETION_APPROVAL_CHANGED']);
    }

    public function test_revision_returns_project_to_active_and_requires_comment(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create(['project_manager_id' => $admin->id, 'status' => 'active']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'done']);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/submit-completion")->assertOk();
        $this->postJson("/api/projects/{$project->id}/request-completion-revision")->assertUnprocessable();
        $this->postJson("/api/projects/{$project->id}/request-completion-revision", ['comment' => 'Needs more work'])
            ->assertOk();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'status' => 'active']);
        $this->assertNull($project->fresh()->completed_at);
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
