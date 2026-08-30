<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApprovalStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Models\Task;
use App\Models\User;
use App\Support\VisibleProjectScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();
        $isProjectManager = $user->hasRole('project-manager');
        $isViewer = $user->hasRole('viewer');
        $projectScope = VisibleProjectScope::apply(Project::query(), $user);
        $taskScope = Task::query()->whereHas('project', fn (Builder $projects) => VisibleProjectScope::apply($projects, $user));
        $myTaskScope = (clone $taskScope)->where('assignee_id', $user->id);

        $dashboard = [
            'role' => $isSuperAdmin ? 'super-admin' : ($isProjectManager ? 'project-manager' : ($isViewer ? 'viewer' : 'member')),
            'total_users' => $isSuperAdmin ? User::count() : null,
            'total_projects' => (clone $projectScope)->count(),
            'active_projects' => (clone $projectScope)->where('status', ProjectStatus::ACTIVE)->count(),
            'completed_projects' => (clone $projectScope)->where('status', ProjectStatus::COMPLETED)->count(),
            'overdue_projects' => (clone $projectScope)->whereDate('deadline', '<', today())->whereNotIn('status', [ProjectStatus::COMPLETED, ProjectStatus::CANCELLED])->count(),
            'pending_project_approvals' => ($user->hasPermission('project.approve_completion') || $isSuperAdmin)
                ? ProjectApproval::query()
                    ->where('status', ApprovalStatus::PENDING)
                    ->whereHas('project', fn (Builder $projects) => VisibleProjectScope::apply($projects, $user))
                    ->count()
                : null,
            'revision_requested_projects' => (clone $projectScope)
                ->where('status', ProjectStatus::ACTIVE)
                ->whereHas('approvals', fn (Builder $q) => $q->where('status', ApprovalStatus::REVISION_REQUIRED))
                ->count(),
            'total_tasks' => (clone $taskScope)->count(),
            'in_progress_tasks' => (clone $taskScope)->where('status', TaskStatus::IN_PROGRESS)->count(),
            'done_tasks' => (clone $taskScope)->where('status', TaskStatus::DONE)->count(),
            'overdue_tasks' => (clone $taskScope)->whereDate('deadline', '<', today())->where('status', '!=', TaskStatus::DONE)->count(),
            'assigned_tasks' => (clone $myTaskScope)->count(),
            'due_soon_tasks' => (clone $myTaskScope)->whereBetween('deadline', [today(), today()->addDays(3)])->where('status', '!=', TaskStatus::DONE)->count(),
            'pending_approvals' => ($user->hasPermission('task.approve') || $isSuperAdmin)
                ? Approval::query()
                    ->where('status', ApprovalStatus::PENDING)
                    ->whereHas('task', function (Builder $tasks) use ($user) {
                        VisibleProjectScope::actionableTasks($tasks, $user);
                        $tasks->whereHas('project', fn (Builder $projects) => VisibleProjectScope::apply($projects, $user));
                    })
                    ->count()
                : null,
            'recent_messages' => Message::query()
                ->whereHas('conversation.participants', fn ($q) => $q->where('user_id', $user->id))
                ->with(['user:id,name', 'conversation:id,type,name,team_id,project_id', 'conversation.team:id,name', 'conversation.project:id,name'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (Message $m) => [
                    'id' => $m->id,
                    'body' => $m->body,
                    'user_name' => $m->user?->name,
                    'conversation_id' => $m->conversation_id,
                    'conversation_type' => $m->conversation?->type,
                    'conversation_name' => $m->conversation?->name ?? $m->conversation?->team?->name ?? $m->conversation?->project?->name,
                    'created_at' => $m->created_at->toISOString(),
                ]),
            'tasks_by_status' => (clone $taskScope)->selectRaw('status, COUNT(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status'),
            'team_workload' => (clone $taskScope)
                ->whereNotNull('assignee_id')
                ->with('assignee:id,name,email')
                ->selectRaw("assignee_id, COUNT(*) as total_tasks, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks, SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks")
                ->groupBy('assignee_id')
                ->orderByDesc('total_tasks')
                ->limit(6)
                ->get()
                ->filter(fn (Task $task) => $task->assignee !== null)
                ->map(fn (Task $task) => [
                    'user' => [
                        'id' => $task->assignee->id,
                        'name' => $task->assignee->name,
                        'email' => $task->assignee->email,
                    ],
                    'total_tasks' => (int) $task->total_tasks,
                    'completed_tasks' => (int) $task->completed_tasks,
                    'in_progress_tasks' => (int) $task->in_progress_tasks,
                ])
                ->values(),
            'upcoming_deadlines' => (clone $taskScope)
                ->with(['project:id,name', 'assignee:id,name,email'])
                ->select(['id', 'title', 'priority', 'deadline', 'status', 'project_id', 'assignee_id'])
                ->whereNotNull('deadline')
                ->whereDate('deadline', '<=', today()->addDays(14))
                ->whereNotIn('status', [TaskStatus::DONE])
                ->orderByRaw("CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END")
                ->orderBy('deadline')
                ->limit(6)
                ->get()
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'priority' => $task->priority->value,
                    'deadline' => $task->deadline?->toDateString(),
                    'status' => $task->status->value,
                    'is_overdue' => $task->deadline->isPast() && ! $task->deadline->isToday(),
                    'project_name' => $task->project?->name,
                    'assignee_name' => $task->assignee?->name,
                ]),
            'recent_activities' => $isSuperAdmin
                ? AuditLog::query()
                    ->with('user:id,name,email')
                    ->latest('id')
                    ->limit(6)
                    ->get()
                    ->map(fn (AuditLog $log) => [
                        'id' => $log->id,
                        'user_id' => $log->user_id,
                        'action' => $log->action,
                        'entity_type' => $log->entity_type,
                        'entity_id' => $log->entity_id,
                        'user' => $log->user ? [
                            'id' => $log->user->id,
                            'name' => $log->user->name,
                            'email' => $log->user->email,
                        ] : null,
                        'created_at' => $log->created_at?->toISOString(),
                    ])
                : [],
        ];

        return response()->json(['success' => true, 'message' => 'Dashboard berhasil dimuat.', 'data' => $dashboard]);
    }
}
