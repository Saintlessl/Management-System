<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAdministrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_create_role_with_permissions(): void
    {
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $admin = User::factory()->create();
        $admin->roles()->attach($superAdminRole);
        $permission = Permission::create(['name' => 'View users', 'slug' => 'users.view', 'group' => 'Users']);
        $this->loginAs($admin);

        $this->postJson('/api/admin/roles', [
            'name' => 'Team Lead',
            'description' => 'Leads a team.',
            'permission_ids' => [$permission->id],
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'team-lead')
            ->assertJsonPath('data.permissions.0.slug', 'users.view');
    }

    public function test_normalized_duplicate_slug_is_rejected(): void
    {
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        Role::create(['name' => 'Team Lead', 'slug' => 'team-lead']);
        $admin = User::factory()->create();
        $admin->roles()->attach($superAdminRole);
        $this->loginAs($admin);

        $this->postJson('/api/admin/roles', [
            'name' => 'Different Name',
            'slug' => 'Team Lead!!!',
        ])->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_role_in_use_cannot_be_deleted(): void
    {
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $assignedRole = Role::create(['name' => 'Member', 'slug' => 'member']);
        $admin = User::factory()->create();
        $admin->roles()->attach($superAdminRole);
        $member = User::factory()->create();
        $member->roles()->attach($assignedRole);
        $this->loginAs($admin);

        $this->deleteJson("/api/admin/roles/{$assignedRole->id}")
            ->assertConflict();
    }

    public function test_super_admin_role_cannot_be_changed_or_deleted(): void
    {
        $role = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $admin = User::factory()->create();
        $admin->roles()->attach($role);
        $this->loginAs($admin);

        $this->patchJson("/api/admin/roles/{$role->id}", ['name' => 'Changed'])
            ->assertConflict();

        $this->deleteJson("/api/admin/roles/{$role->id}")
            ->assertConflict();
    }
}
