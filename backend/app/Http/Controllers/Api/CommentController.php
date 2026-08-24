<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskCommentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Task $task): JsonResponse
    {
        $this->authorize('view', $task);
        $comments = $task->comments()->whereNull('parent_id')->with(['user', 'replies.user'])->oldest()->get();

        return response()->json(['success' => true, 'message' => 'Komentar berhasil dimuat.', 'data' => CommentResource::collection($comments)]);
    }

    public function store(StoreCommentRequest $request, Task $task): JsonResponse
    {
        $this->authorize('create', [Comment::class, $task]);
        $data = $request->validated();
        if (! empty($data['parent_id'])) {
            abort_unless(Comment::query()->whereKey($data['parent_id'])->where('task_id', $task->id)->exists(), 422, 'Reply harus berada pada task yang sama.');
        }
        $comment = $task->comments()->create(['user_id' => $request->user()->id, ...$data]);
        $comment->load(['user', 'task.project']);
        $this->notifyParticipants($comment);

        return response()->json(['success' => true, 'message' => 'Komentar berhasil dibuat.', 'data' => new CommentResource($comment)], 201);
    }

    public function update(StoreCommentRequest $request, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);
        $comment->update(['body' => $request->validated('body')]);

        return response()->json(['success' => true, 'message' => 'Komentar berhasil diperbarui.', 'data' => new CommentResource($comment->load('user'))]);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);
        $comment->delete();

        return response()->json(['success' => true, 'message' => 'Komentar berhasil dihapus.', 'data' => null]);
    }

    private function notifyParticipants(Comment $comment): void
    {
        $recipients = collect([$comment->task->reporter, $comment->task->assignee])->filter();
        preg_match_all('/@([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/', $comment->body, $matches);
        if (! empty($matches[1])) {
            $mentioned = User::query()->whereIn('email', $matches[1])->whereHas('projectMemberships', fn ($query) => $query->where('project_id', $comment->task->project_id))->get();
            $recipients = $recipients->merge($mentioned);
        }
        $recipients->unique('id')->reject(fn (User $user) => $user->id === $comment->user_id)->each(fn (User $user) => $user->notify(new TaskCommentNotification($comment)));
    }
}
