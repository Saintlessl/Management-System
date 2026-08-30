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

    public function test_local_auth_allows_both_frontend_origins(): void
    {
        $this->assertContains('http://localhost:5173', config('cors.allowed_origins'));
        $this->assertContains('http://127.0.0.1:5173', config('cors.allowed_origins'));
    }

    public function test_local_auth_uses_host_only_cookies(): void
    {
        $response = $this
            ->withHeader('Origin', 'http://127.0.0.1:5173')
            ->get('/sanctum/csrf-cookie');

        $response->assertNoContent()->assertCookie('XSRF-TOKEN');

        $xsrfCookie = collect($response->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === 'XSRF-TOKEN');

        $this->assertNotNull($xsrfCookie);
        $this->assertNull(
            $xsrfCookie->getDomain(),
            'Local auth cookies must be host-only so both localhost and 127.0.0.1 work.',
        );
    }

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
