<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Conversation::class);
        $conversations = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['latestMessage.user', 'participants', 'team', 'project'])
            ->withCount('messages')
            ->orderByDesc('updated_at')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'message' => 'Daftar percakapan berhasil dimuat.',
            'data' => ConversationResource::collection($conversations->getCollection())->resolve(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    public function show(Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $conversation->load(['latestMessage.user', 'participants', 'team', 'project']);

        return response()->json([
            'success' => true,
            'message' => 'Percakapan berhasil dimuat.',
            'data' => new ConversationResource($conversation),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Conversation::class);
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $otherUserId = $request->integer('user_id');
        if ($otherUserId === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak dapat membuat percakapan dengan diri sendiri.', 'data' => null], 422);
        }

        $otherUser = User::findOrFail($otherUserId);
        abort_unless($otherUser->is_active, 422, 'Pengguna tidak aktif.');

        $conversation = Conversation::findOrCreatePrivate(
            $request->user()->id,
            $otherUserId,
            $request->user()->id,
        );

        $conversation->load(['latestMessage.user', 'participants']);

        return response()->json([
            'success' => true,
            'message' => 'Percakapan berhasil dibuat.',
            'data' => new ConversationResource($conversation),
        ], 201);
    }

    public function search(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Conversation::class);
        $request->validate(['query' => ['required', 'string', 'max:255']]);

        $query = $request->input('query');
        $user = $request->user();

        $users = User::query()
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->limit(20)
            ->get(['id', 'name', 'email', 'avatar']);

        $conversations = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhereHas('team', fn ($tq) => $tq->where('name', 'like', "%{$query}%"))
                    ->orWhereHas('project', fn ($pq) => $pq->where('name', 'like', "%{$query}%"));
            })
            ->with(['latestMessage.user', 'team', 'project'])
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Hasil pencarian berhasil dimuat.',
            'data' => [
                'users' => $users,
                'conversations' => ConversationResource::collection($conversations)->resolve(),
            ],
        ]);
    }
}
