<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = Cache::remember("dashboard:user:{$user->id}", now()->addMinutes(2), function () use ($user) {
            $projectScope = Project::query()->when(! $user->isSuperAdmin(), fn (Builder $q) => $q->where(fn (Builder $q) => $q->where('project_manager_id', $user->id)->orWhereHas('projectMembers', fn (Builder $m) => $m->where('user_id', $user->id))));
            $projectIds = (clone $projectScope)->pluck('id');
            $taskScope = Task::query()->when(! $user->isSuperAdmin(), fn (Builder $q) => $q->whereIn('project_id', $projectIds));

            return [
                'total_users' => $user->isSuperAdmin() ? User::count() : null,
                'total_projects' => (clone $projectScope)->count(),
                'active_projects' => (clone $projectScope)->where('status', ProjectStatus::ACTIVE)->count(),
                'overdue_projects' => (clone $projectScope)->whereDate('deadline', '<', today())->whereNotIn('status', [ProjectStatus::COMPLETED, ProjectStatus::CANCELLED])->count(),
                'total_tasks' => (clone $taskScope)->count(),
                'done_tasks' => (clone $taskScope)->where('status', TaskStatus::DONE)->count(),
                'overdue_tasks' => (clone $taskScope)->whereDate('deadline', '<', today())->where('status', '!=', TaskStatus::DONE)->count(),
                'assigned_tasks' => Task::where('assignee_id', $user->id)->count(),
                'due_soon_tasks' => Task::where('assignee_id', $user->id)->whereBetween('deadline', [today(), today()->addDays(3)])->where('status', '!=', TaskStatus::DONE)->count(),
                'tasks_by_status' => (clone $taskScope)->selectRaw('status, COUNT(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status'),
            ];
        });

        return response()->json(['success' => true, 'message' => 'Dashboard berhasil dimuat.', 'data' => $data]);
    }
}
