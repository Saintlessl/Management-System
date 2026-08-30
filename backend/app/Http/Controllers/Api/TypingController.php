<?php

namespace App\Http\Controllers\Api;

use App\Events\TypingBroadcast;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TypingController extends Controller
{
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->participants()->where('user_id', $request->user()->id)->exists(),
            403,
        );

        $request->validate(['is_typing' => ['required', 'boolean']]);

        broadcast(new TypingBroadcast(
            $conversation->id,
            $request->user()->id,
            $request->user()->name,
            $request->boolean('is_typing'),
        ));

        return response()->json(['success' => true]);
    }
}
