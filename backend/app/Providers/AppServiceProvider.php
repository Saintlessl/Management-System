<?php

namespace App\Providers;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use App\Policies\AttachmentPolicy;
use App\Policies\CommentPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\MessagePolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TaskPolicy;
use App\Policies\TeamPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(Team::class, TeamPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(Attachment::class, AttachmentPolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(Message::class, MessagePolicy::class);

        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email')));

            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });
    }
}
