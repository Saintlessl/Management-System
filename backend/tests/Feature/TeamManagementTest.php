<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_create_team(): void
    {
        $admin = $this->superAdmin();
        $this->loginAs($admin);

        $teamId = $this->postJson('/api/teams', [
            'name' => 'Frontend Team',
            'description' => 'Tim frontend',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('teams', ['id' => $teamId, 'name' => 'Frontend Team']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'TEAM_CREATED']);
    }

    public function test_unauthorized_user_cannot_create_team(): void
    {
        $member = $this->member();
        $this->loginAs($member);

        $this->postJson('/api/teams', ['name' => 'No Access'])->assertForbidden();
    }

    public function test_team_member_can_be_added_and_duplicate_is_rejected(): void
    {
        $admin = $this->superAdmin();
        $team = Team::create(['name' => 'Backend', 'created_by' => $admin->id]);
        $user = User::factory()->create();
        $this->loginAs($admin);

        $this->postJson("/api/teams/{$team->id}/members", [
            'user_id' => $user->id,
            'team_role' => 'member',
        ])->assertCreated();

        $this->postJson("/api/teams/{$team->id}/members", [
            'user_id' => $user->id,
            'team_role' => 'member',
        ])->assertConflict();
    }

    public function test_team_can_be_linked_to_project(): void
    {
        $admin = $this->superAdmin();
        $team = Team::create(['name' => 'Design', 'created_by' => $admin->id]);
        $this->loginAs($admin);

        $projectId = $this->postJson('/api/projects', [
            'name' => 'Landing Page',
            'status' => 'planning',
            'priority' => 'high',
            'team_id' => $team->id,
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('projects', ['id' => $projectId, 'team_id' => $team->id, 'priority' => 'high']);
    }

    public function test_cannot_mark_project_completed_directly(): void
    {
        $admin = $this->superAdmin();
        $this->loginAs($admin);

        $projectId = $this->postJson('/api/projects', [
            'name' => 'Direct Complete',
            'status' => 'planning',
        ])->assertCreated()->json('data.id');

        $this->patchJson("/api/projects/{$projectId}", ['status' => 'completed'])->assertStatus(422);
        $this->assertDatabaseHas('projects', ['id' => $projectId, 'status' => 'planning']);
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }

    private function member(): User
    {
        $permission = Permission::create(['name' => 'Project View', 'slug' => 'project.view', 'group' => 'Projects']);
        $role = Role::create(['name' => 'Member', 'slug' => 'member']);
        $role->permissions()->attach($permission);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
