<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_login_and_load_permissions(): void
    {
        $permission = Permission::create(['name' => 'View users', 'slug' => 'users.view', 'group' => 'Users']);
        $role = Role::create(['name' => 'Administrator', 'slug' => 'administrator']);
        $role->permissions()->attach($permission);
        $user = User::factory()->create(['password' => 'Password123', 'is_active' => true]);
        $user->roles()->attach($role);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.roles.0.permissions.0.slug', 'users.view');
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        $user = User::factory()->create(['password' => 'Password123']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create(['password' => 'Password123', 'is_active' => false]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create(['password' => 'Password123']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ])->assertOk();

        $this->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_login_normalizes_email(): void
    {
        $user = User::factory()->create([
            'email' => 'person@example.com',
            'password' => 'Password123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => '  PERSON@EXAMPLE.COM ',
            'password' => 'Password123',
        ])->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_user_disabled_after_login_loses_access(): void
    {
        $user = User::factory()->create(['password' => 'Password123', 'is_active' => true]);
        $this->loginAs($user);
        $user->update(['is_active' => false]);
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/auth/user')->assertUnauthorized();
    }
}
