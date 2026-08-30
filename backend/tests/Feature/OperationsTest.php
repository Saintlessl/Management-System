<?php

namespace Tests\Feature;

use App\Enums\ApprovalStatus;
use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskWorkflowNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class OperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_dashboard_returns_aggregated_counts(): void
    {
        $admin = $this->superAdmin();
        Project::factory()->count(2)->create(['status' => 'active']);
        $project = Project::firstOrFail();
        Task::factory()->create(['project_id' => $project->id, 'status' => 'done']);
        $this->loginAs($admin);
        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('data.total_projects', 2)->assertJsonPath('data.done_tasks', 1);
    }

    public function test_dashboard_returns_upcoming_deadlines_workload_and_pending_approvals(): void
    {
        $admin = $this->superAdmin();
        $member = User::factory()->create(['name' => 'Workload Member']);
        $project = Project::factory()->create(['project_manager_id' => $admin->id]);
        $project->projectMembers()->create(['user_id' => $member->id, 'project_role' => 'member', 'joined_at' => now()]);
        $due = Task::factory()->create([
            'project_id' => $project->id,
            'assignee_id' => $member->id,
            'status' => 'in_progress',
            'priority' => 'high',
            'deadline' => today()->addDay(),
        ]);
        $review = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'review',
            'deadline' => today()->addDays(2),
        ]);
        $review->approvals()->create(['status' => ApprovalStatus::PENDING, 'requested_by' => $admin->id]);
        $this->loginAs($admin);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.upcoming_deadlines.0.id', $due->id)
            ->assertJsonPath('data.team_workload.0.user.id', $member->id)
            ->assertJsonPath('data.pending_approvals', 1);
    }

    public function test_dashboard_cache_is_invalidated_after_task_creation(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $this->loginAs($admin);

        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('data.total_tasks', 0);
        $this->postJson("/api/projects/{$project->id}/tasks", ['title' => 'Changes dashboard'])
            ->assertCreated();
        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('data.total_tasks', 1);
    }

    public function test_notifications_can_be_listed_and_marked_read(): void
    {
        $admin = $this->superAdmin();
        $task = Task::factory()->create();
        $admin->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => TaskWorkflowNotification::class,
            'data' => ['event' => 'assigned', 'task_id' => $task->id],
        ]);
        $this->loginAs($admin);
        $id = $this->getJson('/api/notifications')->assertOk()->json('data.0.id');
        $this->getJson('/api/notifications/unread-count')->assertJsonPath('data.count', 1);
        $this->patchJson("/api/notifications/{$id}/read")->assertOk();
        $this->getJson('/api/notifications/unread-count')->assertJsonPath('data.count', 0);
    }

    public function test_deadline_reminder_command_is_idempotent_for_the_day(): void
    {
        Notification::fake();
        Cache::flush();
        $user = User::factory()->create();
        Task::factory()->create(['assignee_id' => $user->id, 'deadline' => today(), 'status' => 'in_progress']);
        $this->artisan('tasks:send-deadline-reminders')->assertSuccessful();
        $this->artisan('tasks:send-deadline-reminders')->assertSuccessful();
        Notification::assertSentToTimes($user, TaskWorkflowNotification::class, 1);
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
