<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CollaborationTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_user_can_comment_and_reply_but_outsider_is_forbidden(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $this->loginAs($admin);
        $commentId = $this->postJson("/api/tasks/{$task->id}/comments", ['body' => 'Initial'])->assertCreated()->json('data.id');
        $this->postJson("/api/tasks/{$task->id}/comments", ['body' => 'Reply', 'parent_id' => $commentId])->assertCreated();

        $this->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $outsider = User::factory()->create();
        $role = Role::create(['name' => 'Outsider', 'slug' => 'outsider']);
        $permission = Permission::create(['name' => 'Task View', 'slug' => 'task.view', 'group' => 'Tasks']);
        $role->permissions()->attach($permission);
        $outsider->roles()->attach($role);
        $this->loginAs($outsider);
        $this->getJson("/api/tasks/{$task->id}/comments")->assertForbidden();
    }

    public function test_reply_from_another_task_is_rejected(): void
    {
        Notification::fake();
        $admin = $this->superAdmin();
        $first = Task::factory()->create();
        $second = Task::factory()->create();
        $comment = $first->comments()->create(['user_id' => $admin->id, 'body' => 'First']);
        $this->loginAs($admin);

        $this->postJson("/api/tasks/{$second->id}/comments", ['body' => 'Invalid', 'parent_id' => $comment->id])->assertUnprocessable();
    }

    public function test_private_attachment_upload_download_and_delete_are_authorized(): void
    {
        Storage::fake('local');
        $admin = $this->superAdmin();
        $task = Task::factory()->create();
        $this->loginAs($admin);

        $attachmentId = $this->postJson("/api/tasks/{$task->id}/attachments", [
            'file' => UploadedFile::fake()->create('report.pdf', 100, 'application/pdf'),
        ])->assertCreated()->assertJsonMissingPath('data.path')->json('data.id');

        $this->get("/api/attachments/{$attachmentId}/download")->assertOk();
        $this->deleteJson("/api/attachments/{$attachmentId}")->assertOk();
        $this->assertDatabaseMissing('attachments', ['id' => $attachmentId]);
    }

    public function test_unrelated_project_user_cannot_download_attachment(): void
    {
        Storage::fake('local');
        $admin = $this->superAdmin();
        $task = Task::factory()->create();
        $this->loginAs($admin);
        $attachmentId = $this->postJson("/api/tasks/{$task->id}/attachments", [
            'file' => UploadedFile::fake()->create('private.pdf', 10, 'application/pdf'),
        ])->assertCreated()->json('data.id');
        $this->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();

        $view = Permission::create(['name' => 'Attachment Download', 'slug' => 'attachment.download', 'group' => 'Attachments']);
        $role = Role::create(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->permissions()->attach($view);
        $outsider = User::factory()->create();
        $outsider->roles()->attach($role);
        $this->loginAs($outsider);

        $this->get("/api/attachments/{$attachmentId}/download")->assertForbidden();
    }

    public function test_viewer_cannot_upload_attachment_or_comment(): void
    {
        Storage::fake('local');
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $viewer = User::factory()->create();
        $project->projectMembers()->create(['user_id' => $viewer->id, 'project_role' => 'viewer', 'joined_at' => now()]);
        $permissions = collect([
            ['name' => 'Task View', 'slug' => 'task.view', 'group' => 'Tasks'],
            ['name' => 'Attachment Download', 'slug' => 'attachment.download', 'group' => 'Attachments'],
        ])->map(fn (array $data) => Permission::create($data));
        $role = Role::create(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->permissions()->sync($permissions->pluck('id'));
        $viewer->roles()->attach($role);
        $this->loginAs($viewer);

        $this->postJson("/api/tasks/{$task->id}/comments", ['body' => 'Not allowed'])->assertForbidden();
        $this->postJson("/api/tasks/{$task->id}/attachments", [
            'file' => UploadedFile::fake()->create('file.pdf', 10, 'application/pdf'),
        ])->assertForbidden();
    }

    public function test_invalid_attachment_type_is_rejected(): void
    {
        Storage::fake('local');
        $admin = $this->superAdmin();
        $task = Task::factory()->create();
        $this->loginAs($admin);

        $this->postJson("/api/tasks/{$task->id}/attachments", [
            'file' => UploadedFile::fake()->create('malware.exe', 10, 'application/octet-stream'),
        ])->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    private function superAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
