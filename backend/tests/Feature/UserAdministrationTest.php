<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAdministrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_user_can_create_user_with_role(): void
    {
        $permission = Permission::create(['name' => 'Create users', 'slug' => 'users.create', 'group' => 'Users']);
        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $adminRole->permissions()->attach($permission);
        $memberRole = Role::create(['name' => 'Member', 'slug' => 'member']);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);
        $this->loginAs($admin);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'is_active' => true,
            'role_ids' => [$memberRole->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'new@example.com')
            ->assertJsonPath('data.roles.0.slug', 'member');
        $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    }

    public function test_user_without_permission_is_forbidden(): void
    {
        $user = User::factory()->create();
        $this->loginAs($user);

        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_user_cannot_disable_own_account(): void
    {
        $permission = Permission::create(['name' => 'Update users', 'slug' => 'users.update', 'group' => 'Users']);
        $role = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $role->permissions()->attach($permission);
        $user = User::factory()->create(['is_active' => true]);
        $user->roles()->attach($role);
        $this->loginAs($user);

        $this->patchJson("/api/admin/users/{$user->id}", ['is_active' => false])
            ->assertConflict();

        $this->assertTrue($user->fresh()->is_active);
    }

    public function test_users_admin_can_load_role_options_without_roles_permission(): void
    {
        $viewUsers = Permission::create(['name' => 'View users', 'slug' => 'users.view', 'group' => 'Users']);
        $adminRole = Role::create(['name' => 'Users Admin', 'slug' => 'users-admin']);
        $adminRole->permissions()->attach($viewUsers);
        $assignableRole = Role::create(['name' => 'Member', 'slug' => 'member']);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);
        $this->loginAs($admin);

        $this->getJson('/api/admin/role-options')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $assignableRole->id,
                'slug' => 'member',
            ]);

        $this->getJson('/api/admin/roles')->assertForbidden();
    }

    public function test_user_list_filters_inactive_accounts_and_returns_stable_pagination_meta(): void
    {
        $viewUsers = Permission::create(['name' => 'View users', 'slug' => 'users.view', 'group' => 'Users']);
        $role = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $role->permissions()->attach($viewUsers);
        $admin = User::factory()->create(['is_active' => true]);
        $admin->roles()->attach($role);
        User::factory()->create(['is_active' => false, 'name' => 'Inactive Person']);
        $this->loginAs($admin);

        $this->getJson('/api/admin/users?is_active=false&per_page=5')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Inactive Person')
            ->assertJsonStructure(['meta' => ['current_page', 'last_page', 'links']]);
    }

    public function test_user_cannot_remove_own_super_admin_role(): void
    {
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $user = User::factory()->create();
        $user->roles()->attach($superAdminRole);
        $this->loginAs($user);

        $this->patchJson("/api/admin/users/{$user->id}", ['role_ids' => []])
            ->assertConflict();

        $this->assertTrue($user->fresh()->hasRole('super-admin'));
    }

    public function test_last_active_super_admin_cannot_be_disabled_or_have_role_removed(): void
    {
        $updatePermission = Permission::create(['name' => 'Update users', 'slug' => 'users.update', 'group' => 'Users']);
        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $adminRole->permissions()->attach($updatePermission);
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $superAdmin = User::factory()->create(['is_active' => true]);
        $superAdmin->roles()->attach($superAdminRole);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);
        $this->loginAs($admin);

        $this->patchJson("/api/admin/users/{$superAdmin->id}", ['is_active' => false])
            ->assertConflict();
        $this->patchJson("/api/admin/users/{$superAdmin->id}", ['role_ids' => []])
            ->assertConflict();
    }

    public function test_user_with_business_history_cannot_be_deleted(): void
    {
        $deletePermission = Permission::create(['name' => 'Delete users', 'slug' => 'users.delete', 'group' => 'Users']);
        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $adminRole->permissions()->attach($deletePermission);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);
        $creator = User::factory()->create();
        Project::factory()->create(['created_by' => $creator->id]);
        $this->loginAs($admin);

        $this->deleteJson("/api/admin/users/{$creator->id}")->assertConflict();
        $this->assertDatabaseHas('users', ['id' => $creator->id]);
    }

    public function test_last_active_super_admin_cannot_be_deleted(): void
    {
        $deletePermission = Permission::create(['name' => 'Delete users', 'slug' => 'users.delete', 'group' => 'Users']);
        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $adminRole->permissions()->attach($deletePermission);
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $superAdmin = User::factory()->create(['is_active' => true]);
        $superAdmin->roles()->attach($superAdminRole);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);
        $this->loginAs($admin);

        $this->deleteJson("/api/admin/users/{$superAdmin->id}")
            ->assertConflict();

        $this->assertDatabaseHas('users', ['id' => $superAdmin->id]);
    }
}
