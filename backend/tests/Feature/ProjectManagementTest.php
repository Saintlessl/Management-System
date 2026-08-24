<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_manager_who_creates_project_without_explicit_manager_can_manage_it(): void
    {
        $permissions = collect(['project.view', 'project.create', 'project.update', 'project.manage_members'])
            ->map(fn (string $slug) => Permission::create(['name' => $slug, 'slug' => $slug, 'group' => 'Projects']));
        $role = Role::create(['name' => 'Project Manager', 'slug' => 'project-manager']);
        $role->permissions()->sync($permissions->pluck('id'));
        $manager = User::factory()->create();
        $manager->roles()->attach($role);
        $this->loginAs($manager);

        $projectId = $this->postJson('/api/projects', [
            'name' => 'Manager-created project',
            'status' => 'active',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('projects', [
            'id' => $projectId,
            'project_manager_id' => $manager->id,
        ]);
        $this->assertDatabaseHas('project_members', [
            'project_id' => $projectId,
            'user_id' => $manager->id,
            'project_role' => 'manager',
        ]);
        $this->patchJson("/api/projects/{$projectId}", ['name' => 'Manager can update it'])
            ->assertOk();
    }

    public function test_super_admin_can_create_project_and_manager_is_added_as_member(): void
    {
        $admin = $this->superAdmin();
        $manager = User::factory()->create();
        $this->loginAs($admin);

        $this->postJson('/api/projects', [
            'name' => 'Platform Migration',
            'status' => 'active',
            'start_date' => '2026-08-24',
            'deadline' => '2026-10-24',
            'project_manager_id' => $manager->id,
        ])->assertCreated()
            ->assertJsonPath('data.manager.id', $manager->id);

        $this->assertDatabaseHas('project_members', [
            'user_id' => $manager->id,
            'project_role' => 'manager',
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PROJECT_CREATED']);
    }

    public function test_member_can_view_joined_project_but_unrelated_project_is_forbidden(): void
    {
        $view = Permission::create(['name' => 'Project View', 'slug' => 'project.view', 'group' => 'Projects']);
        $role = Role::create(['name' => 'Member', 'slug' => 'member']);
        $role->permissions()->attach($view);
        $member = User::factory()->create();
        $member->roles()->attach($role);
        $joined = Project::factory()->create();
        $joined->projectMembers()->create(['user_id' => $member->id, 'project_role' => 'member', 'joined_at' => now()]);
        $unrelated = Project::factory()->create();
        $this->loginAs($member);

        $this->getJson("/api/projects/{$joined->id}")->assertOk();
        $this->getJson("/api/projects/{$unrelated->id}")->assertForbidden();
    }

    public function test_project_manager_can_manage_assigned_project_but_not_unrelated_project(): void
    {
        $permissions = collect(['project.view', 'project.update', 'project.manage_members'])
            ->map(fn (string $slug) => Permission::create(['name' => $slug, 'slug' => $slug, 'group' => 'Projects']));
        $role = Role::create(['name' => 'Project Manager', 'slug' => 'project-manager']);
        $role->permissions()->sync($permissions->pluck('id'));
        $manager = User::factory()->create();
        $manager->roles()->attach($role);
        $assigned = Project::factory()->create(['project_manager_id' => $manager->id]);
        $unrelated = Project::factory()->create();
        $this->loginAs($manager);

        $this->patchJson("/api/projects/{$assigned->id}", ['name' => 'Updated'])->assertOk();
        $this->patchJson("/api/projects/{$unrelated->id}", ['name' => 'Forbidden'])->assertForbidden();
    }

    public function test_reassigning_project_manager_revokes_previous_manager_access(): void
    {
        $admin = $this->superAdmin();
        $managerRole = Role::create(['name' => 'Project Manager', 'slug' => 'project-manager']);
        $permissions = collect(['project.view', 'project.update', 'project.manage_members'])
            ->map(fn (string $slug) => Permission::create(['name' => $slug, 'slug' => $slug, 'group' => 'Projects']));
        $managerRole->permissions()->sync($permissions->pluck('id'));
        $oldManager = User::factory()->create();
        $newManager = User::factory()->create();
        $oldManager->roles()->attach($managerRole);
        $newManager->roles()->attach($managerRole);
        $project = Project::factory()->create(['project_manager_id' => $oldManager->id]);
        $project->projectMembers()->create(['user_id' => $oldManager->id, 'project_role' => 'manager', 'joined_at' => now()]);
        $this->loginAs($admin);

        $this->patchJson("/api/projects/{$project->id}", ['project_manager_id' => $newManager->id])
            ->assertOk();

        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $oldManager->id,
            'project_role' => 'member',
        ]);
        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $newManager->id,
            'project_role' => 'manager',
        ]);

        $this->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->loginAs($oldManager);
        $this->patchJson("/api/projects/{$project->id}", ['name' => 'Old manager still controls it'])
            ->assertForbidden();
    }

    public function test_duplicate_membership_is_rejected(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $member = User::factory()->create();
        $project->projectMembers()->create(['user_id' => $member->id, 'project_role' => 'member', 'joined_at' => now()]);
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/members", [
            'user_id' => $member->id,
            'project_role' => 'member',
        ])->assertConflict();
    }

    public function test_project_list_only_contains_accessible_projects(): void
    {
        $view = Permission::create(['name' => 'Project View', 'slug' => 'project.view', 'group' => 'Projects']);
        $role = Role::create(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->permissions()->attach($view);
        $viewer = User::factory()->create();
        $viewer->roles()->attach($role);
        $allowed = Project::factory()->create(['name' => 'Allowed']);
        $allowed->projectMembers()->create(['user_id' => $viewer->id, 'project_role' => 'viewer', 'joined_at' => now()]);
        Project::factory()->create(['name' => 'Hidden']);
        $this->loginAs($viewer);

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Allowed');
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
