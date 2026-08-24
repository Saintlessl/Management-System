<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use App\Notifications\ProjectMemberAddedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdministrationAndContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_validation_errors_use_standard_api_contract(): void
    {
        $admin = $this->superAdmin();
        $this->loginAs($admin);

        $this->postJson('/api/projects', [])->assertUnprocessable()->assertExactJson([
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => ['name' => ['The name field is required.']],
        ]);
    }

    public function test_permission_crud_and_system_deletion_guard(): void
    {
        $admin = $this->superAdmin();
        $this->loginAs($admin);

        $id = $this->postJson('/api/admin/permissions', [
            'name' => 'Export Reports',
            'slug' => 'report.export',
            'group' => 'Reports',
        ])->assertCreated()->json('data.id');

        $this->patchJson("/api/admin/permissions/{$id}", ['name' => 'Export Project Reports', 'slug' => 'report.export'])
            ->assertOk()->assertJsonPath('data.name', 'Export Project Reports');
        $this->deleteJson("/api/admin/permissions/{$id}")->assertOk();

        $protected = Permission::create(['name' => 'Protected', 'slug' => 'protected', 'group' => 'System']);
        $role = Role::where('slug', 'super-admin')->firstOrFail();
        $role->permissions()->attach($protected);
        $this->deleteJson("/api/admin/permissions/{$protected->id}")->assertConflict();
    }

    public function test_project_label_crud_is_scoped_and_validated(): void
    {
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $this->loginAs($admin);

        $id = $this->postJson("/api/projects/{$project->id}/labels", ['name' => 'Backend', 'color' => '#2563eb'])
            ->assertCreated()->json('data.id');
        $this->postJson("/api/projects/{$project->id}/labels", ['name' => 'Backend', 'color' => '#2563eb'])
            ->assertUnprocessable();
        $this->patchJson("/api/labels/{$id}", ['color' => '#dc2626'])->assertOk();
        $this->deleteJson("/api/labels/{$id}")->assertOk();
    }

    public function test_adding_project_member_queues_notification(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $member = User::factory()->create();
        $this->loginAs($admin);

        $this->postJson("/api/projects/{$project->id}/members", [
            'user_id' => $member->id,
            'project_role' => 'member',
        ])->assertCreated();

        Notification::assertSentTo($member, ProjectMemberAddedNotification::class);
    }

    public function test_forbidden_and_not_found_errors_use_standard_contract(): void
    {
        $permission = Permission::create(['name' => 'View Projects', 'slug' => 'project.view', 'group' => 'Projects']);
        $role = Role::create(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->permissions()->attach($permission);
        $viewer = User::factory()->create();
        $viewer->roles()->attach($role);
        $project = Project::factory()->create();
        $this->loginAs($viewer);

        $this->getJson("/api/projects/{$project->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('data', null);
        $this->getJson('/api/projects/999999')
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
