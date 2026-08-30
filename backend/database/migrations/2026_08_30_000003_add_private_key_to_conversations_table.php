<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('conversations', 'private_key')) {
            Schema::table('conversations', function (Blueprint $table): void {
                $table->string('private_key')->nullable()->after('project_id');
            });
        }

        // Preserve existing private conversations while assigning one canonical
        // conversation to each user pair. Historical duplicates remain intact
        // but receive a null key so the unique index can be added safely.
        $claimedKeys = [];
        $privateConversations = DB::table('conversations')
            ->where('type', 'private')
            ->orderBy('id')
            ->get(['id', 'private_key']);

        foreach ($privateConversations as $conversation) {
            $userIds = DB::table('conversation_participants')
                ->where('conversation_id', $conversation->id)
                ->orderBy('user_id')
                ->pluck('user_id');

            if ($userIds->count() !== 2) {
                continue;
            }

            $privateKey = $userIds->implode(':');
            if (isset($claimedKeys[$privateKey])) {
                if ($conversation->private_key !== null) {
                    DB::table('conversations')
                        ->where('id', $conversation->id)
                        ->update(['private_key' => null]);
                }

                continue;
            }

            DB::table('conversations')
                ->where('id', $conversation->id)
                ->update(['private_key' => $privateKey]);
            $claimedKeys[$privateKey] = true;
        }

        if (! Schema::hasIndex('conversations', 'conversations_private_key_unique')) {
            Schema::table('conversations', function (Blueprint $table): void {
                $table->unique('private_key');
            });
        }
    }

    public function down(): void
    {
        // Forward-only compatibility repair. Removing this column would break
        // private chat for databases whose original migration already had it.
    }
};
