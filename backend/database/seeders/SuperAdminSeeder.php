<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $credentials = config('super_admin');

        if (! $credentials['name'] || ! $credentials['email'] || ! $credentials['password']) {
            throw new RuntimeException('SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, dan SUPER_ADMIN_PASSWORD wajib diisi sebelum menjalankan seeder.');
        }

        if (mb_strlen($credentials['password']) < 8) {
            throw new RuntimeException('SUPER_ADMIN_PASSWORD minimal 8 karakter.');
        }

        $user = User::query()->updateOrCreate(
            ['email' => $credentials['email']],
            [
                'name' => $credentials['name'],
                'password' => $credentials['password'],
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $role = Role::query()->where('slug', 'super-admin')->firstOrFail();
        $user->roles()->syncWithoutDetaching([$role->id]);
    }
}
