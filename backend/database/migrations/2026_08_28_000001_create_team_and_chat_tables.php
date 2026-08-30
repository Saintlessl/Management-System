<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('project_approvals')) {
            Schema::create('project_approvals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('status');
                $table->text('comment')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();

                $table->index(['project_id', 'status']);
            });
        }

        if (!Schema::hasTable('project_approval_histories')) {
            Schema::create('project_approval_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_approval_id')->constrained('project_approvals')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('action');
                $table->text('comment')->nullable();
                $table->timestamps();

                $table->index(['project_approval_id']);
            });
        }

        if (!Schema::hasTable('conversations')) {
            Schema::create('conversations', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->string('name')->nullable();
                $table->foreignId('team_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->timestamp('last_message_at')->nullable();
                $table->timestamps();

                $table->index(['team_id', 'project_id']);
                $table->index(['type', 'project_id']);
            });
        }

        if (!Schema::hasTable('conversation_participants')) {
            Schema::create('conversation_participants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamp('last_read_at')->nullable();
                $table->timestamps();

                $table->unique(['conversation_id', 'user_id']);
                $table->index(['user_id']);
            });
        }

        if (!Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('body')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('messages')->nullOnDelete();
                $table->timestamp('edited_at')->nullable();
                $table->timestamps();

                $table->index(['conversation_id', 'created_at']);
                $table->index(['user_id']);
            });
        }

        if (!Schema::hasTable('message_attachments')) {
            Schema::create('message_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('message_id')->constrained()->cascadeOnDelete();
                $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
                $table->string('original_name');
                $table->string('stored_name');
                $table->string('mime_type');
                $table->unsignedInteger('size');
                $table->string('path');
                $table->timestamps();

                $table->index(['message_id']);
            });
        }

        if (!Schema::hasTable('message_reactions')) {
            Schema::create('message_reactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('message_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('emoji');
                $table->timestamps();

                $table->unique(['message_id', 'user_id', 'emoji']);
                $table->index(['user_id']);
            });
        }

        if (!Schema::hasTable('teams')) {
            Schema::create('teams', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->index(['created_by']);
            });
        }

        if (!Schema::hasTable('team_members')) {
            Schema::create('team_members', function (Blueprint $table) {
                $table->id();
                $table->foreignId('team_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('team_role');
                $table->timestamp('joined_at')->nullable();
                $table->timestamps();

                $table->unique(['team_id', 'user_id']);
                $table->index(['user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reactions');
        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('project_approval_histories');
        Schema::dropIfExists('project_approvals');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');
    }
};
