<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('project_manager_id')->constrained()->nullOnDelete();
            $table->string('priority')->default('medium')->after('status');
            $table->timestamp('completion_submitted_at')->nullable()->after('deadline');
            $table->timestamp('completed_at')->nullable()->after('completion_submitted_at');

            $table->index('team_id');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['team_id']);
            $table->dropIndex(['priority']);
            $table->dropConstrainedForeignId('team_id');
            $table->dropColumn(['priority', 'completion_submitted_at', 'completed_at']);
        });
    }
};
