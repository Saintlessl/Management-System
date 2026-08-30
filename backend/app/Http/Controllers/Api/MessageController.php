<?php

namespace App\Http\Controllers\Api;

use App\Events\NewMessageBroadcast;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = $conversation->messages()
            ->with(['user', 'parent.user', 'reactions.user', 'attachments.uploader'])
            ->withCount('replies')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dimuat.',
            'data' => MessageResource::collection($messages->getCollection())->resolve(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('send', $conversation);

        $message = DB::transaction(function () use ($request, $conversation) {
            $msg = $conversation->messages()->create([
                'user_id' => $request->user()->id,
                'body' => $request->input('body'),
                'parent_id' => $request->input('parent_id'),
            ]);

            if ($request->hasFile('attachments')) {
                $this->storeAttachments($msg, $request->file('attachments'), $request->user()->id);
            }

            $conversation->update(['updated_at' => now()]);

            return $msg;
        });

        $message->load(['user', 'reactions.user', 'attachments.uploader']);
        $conversation->markAsReadFor($request->user());

        // Broadcast to conversation participants
        broadcast(new NewMessageBroadcast($message));

        // Send DB notifications to participants (except sender)
        $conversation->participants()
            ->where('user_id', '!=', $request->user()->id)
            ->each(fn ($participant) => $participant->notify(new NewMessageNotification($message, $conversation)));

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dikirim.',
            'data' => new MessageResource($message),
        ], 201);
    }

    public function update(Request $request, Message $message): JsonResponse
    {
        $this->authorize('update', $message);

        $request->validate(['body' => ['required', 'string', 'max:5000']]);

        $message->update([
            'body' => $request->input('body'),
            'edited_at' => now(),
        ]);

        $message->load(['user', 'reactions.user', 'attachments.uploader']);

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil diperbarui.',
            'data' => new MessageResource($message),
        ]);
    }

    public function destroy(Message $message): JsonResponse
    {
        $this->authorize('delete', $message);

        DB::transaction(function () use ($message) {
            foreach ($message->attachments as $attachment) {
                Storage::disk('local')->delete($attachment->path);
            }
            $message->delete();
        });

        return response()->json(['success' => true, 'message' => 'Pesan berhasil dihapus.', 'data' => null]);
    }

    public function downloadAttachment(Message $message, int $attachmentId): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless($message->conversation->participants()->where('user_id', request()->user()->id)->exists(), 403);

        $attachment = $message->attachments()->findOrFail($attachmentId);

        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }

    private function storeAttachments(Message $message, array $files, int $userId): void
    {
        foreach ($files as $file) {
            $storedName = uniqid('chat_', true).'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('chat/attachments', $storedName, 'local');

            $message->attachments()->create([
                'uploaded_by' => $userId,
                'original_name' => $file->getClientOriginalName(),
                'stored_name' => $storedName,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
            ]);
        }
    }
}
