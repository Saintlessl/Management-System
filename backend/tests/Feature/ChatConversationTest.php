<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ChatConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_compatibility_migration_restores_private_chat_for_legacy_databases(): void
    {
        if (Schema::hasIndex('conversations', 'conversations_private_key_unique')) {
            Schema::table('conversations', function (Blueprint $table): void {
                $table->dropUnique('conversations_private_key_unique');
            });
        }

        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropColumn('private_key');
        });

        DB::table('migrations')
            ->where('migration', '2026_08_30_000003_add_private_key_to_conversations_table')
            ->delete();

        Artisan::call('migrate', ['--force' => true]);

        $this->assertTrue(Schema::hasColumn('conversations', 'private_key'));

        $role = Role::query()->create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
        ]);
        $creator = User::factory()->create(['is_active' => true]);
        $creator->roles()->attach($role);
        $recipient = User::factory()->create(['is_active' => true]);
        $this->loginAs($creator);

        $first = $this->postJson('/api/conversations', ['user_id' => $recipient->id])
            ->assertCreated()
            ->assertJsonPath('data.type', 'private');

        $this->postJson('/api/conversations', ['user_id' => $recipient->id])
            ->assertCreated()
            ->assertJsonPath('data.id', $first->json('data.id'));

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('conversation_participants', 2);
    }
}
