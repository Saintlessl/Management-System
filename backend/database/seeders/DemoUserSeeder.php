<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Manager Demo',
                'email' => 'manager@example.com',
                'password' => bcrypt('password'),
                'role' => 'project-manager',
            ],
            [
                'name' => 'Member Demo',
                'email' => 'member@example.com',
                'password' => bcrypt('password'),
                'role' => 'member',
            ],
            [
                'name' => 'Viewer Demo',
                'email' => 'viewer@example.com',
                'password' => bcrypt('password'),
                'role' => 'viewer',
            ],
        ];

        foreach ($users as $data) {
            $role = Role::where('slug', $data['role'])->first();
            if (!$role) {
                continue;
            }

            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $data['password'],
                    'is_active' => true,
                ]
            );

            $user->roles()->syncWithoutDetaching([$role->id]);
        }
    }
}
