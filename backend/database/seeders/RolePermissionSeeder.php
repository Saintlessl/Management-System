<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissionGroups = [
            'Users' => ['users.view', 'users.create', 'users.update', 'users.delete'],
            'Roles' => ['roles.view', 'roles.create', 'roles.update', 'roles.delete', 'permissions.view', 'permissions.create', 'permissions.update', 'permissions.delete'],
            'Projects' => ['project.view', 'project.create', 'project.update', 'project.delete', 'project.manage_members', 'project.submit_completion', 'project.approve_completion'],
            'Teams' => ['team.view', 'team.create', 'team.update', 'team.delete', 'team.manage_members'],
            'Tasks' => ['task.view', 'task.create', 'task.update', 'task.delete', 'task.assign', 'task.move', 'task.submit_review', 'task.approve'],
            'Comments' => ['comment.create', 'comment.update', 'comment.delete'],
            'Attachments' => ['attachment.upload', 'attachment.download'],
            'Notifications' => ['notification.view'],
            'Chat' => ['chat.view', 'chat.create', 'chat.send', 'chat.manage'],
            'Audit' => ['audit.view'],
        ];

        foreach ($permissionGroups as $group => $slugs) {
            foreach ($slugs as $slug) {
                Permission::query()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => str($slug)->replace(['.', '_'], ' ')->title()->toString(),
                        'group' => $group,
                    ],
                );
            }
        }

        $roles = [
            'super-admin' => [
                'name' => 'Super Admin',
                'description' => 'Role sistem dengan akses penuh.',
                'permissions' => Permission::query()->pluck('slug')->all(),
            ],
            'project-manager' => [
                'name' => 'Project Manager',
                'description' => 'Mengelola project yang ditugaskan beserta anggota dan task.',
                'permissions' => [
                    'project.view', 'project.create', 'project.update', 'project.manage_members', 'project.submit_completion', 'project.approve_completion',
                    'team.view', 'team.create', 'team.update', 'team.manage_members',
                    'task.view', 'task.create', 'task.update', 'task.delete', 'task.assign', 'task.move', 'task.submit_review', 'task.approve',
                    'comment.create', 'comment.update', 'comment.delete',
                    'attachment.upload', 'attachment.download', 'notification.view',
                    'chat.view', 'chat.create', 'chat.send', 'chat.manage',
                ],
            ],
            'member' => [
                'name' => 'Member',
                'description' => 'Berkolaborasi pada project dan task yang diizinkan.',
                'permissions' => [
                    'project.view', 'task.view', 'task.update', 'task.move', 'task.submit_review',
                    'comment.create', 'comment.update', 'comment.delete',
                    'attachment.upload', 'attachment.download', 'notification.view',
                    'chat.view', 'chat.create', 'chat.send',
                ],
            ],
            'viewer' => [
                'name' => 'Viewer',
                'description' => 'Melihat project dan progress yang diberikan tanpa hak modifikasi.',
                'permissions' => ['project.view', 'task.view', 'comment.create', 'attachment.download', 'notification.view', 'chat.view'],
            ],
        ];

        foreach ($roles as $slug => $definition) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                ],
            );

            $role->permissions()->sync(
                Permission::query()->whereIn('slug', $definition['permissions'])->pluck('id'),
            );
        }
    }
}
