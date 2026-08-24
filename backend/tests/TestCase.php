<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost:5173');
        $this->withServerVariables([
            'HTTP_HOST' => 'localhost:8000',
            'SERVER_NAME' => 'localhost',
            'SERVER_PORT' => '8000',
        ]);
    }

    protected function loginAs(User $user, string $password = 'Password123'): void
    {
        $user->update(['password' => $password]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ])->assertOk();
    }
}
