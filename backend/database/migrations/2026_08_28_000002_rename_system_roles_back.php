<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('system_roles') && !Schema::hasTable('roles')) {
            Schema::rename('system_roles', 'roles');
        }
        if (Schema::hasTable('system_role_user') && !Schema::hasTable('role_user')) {
            Schema::rename('system_role_user', 'role_user');
        }
        if (Schema::hasTable('system_role_permission') && !Schema::hasTable('permission_role')) {
            Schema::rename('system_role_permission', 'permission_role');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('roles') && !Schema::hasTable('system_roles')) {
            Schema::rename('roles', 'system_roles');
        }
        if (Schema::hasTable('role_user') && !Schema::hasTable('system_role_user')) {
            Schema::rename('role_user', 'system_role_user');
        }
        if (Schema::hasTable('permission_role') && !Schema::hasTable('system_role_permission')) {
            Schema::rename('permission_role', 'system_role_permission');
        }
    }
};