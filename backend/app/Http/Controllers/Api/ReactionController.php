<?php

namespace App\Http\Controllers\Api;

use App\Events\NewReactionBroadcast;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreReactionRequest;
use App\Http\Resources\MessageReactionResource;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\JsonResponse;

class ReactionController extends Controller
{
    public function store(StoreReactionRequest $request, Message $message): JsonResponse
    {
        abort_unless($message->conversation->participants()->where('user_id', $request->user()->id)->exists(), 403);

        $reaction = MessageReaction::updateOrCreate(
            ['message_id' => $message->id, 'user_id' => $request->user()->id, 'emoji' => $request->input('emoji')],
            [],
        );

        $reaction->load('user');

        broadcast(new NewReactionBroadcast($reaction));

        return response()->json([
            'success' => true,
            'message' => 'Reaksi berhasil ditambahkan.',
            'data' => new MessageReactionResource($reaction),
        ], 201);
    }

    public function destroy(Message $message, MessageReaction $reaction): JsonResponse
    {
        abort_unless($reaction->message_id === $message->id, 404);
        abort_unless($reaction->user_id === request()->user()->id || request()->user()->isSuperAdmin(), 403);

        $reaction->delete();

        return response()->json(['success' => true, 'message' => 'Reaksi berhasil dihapus.', 'data' => null]);
    }
}
