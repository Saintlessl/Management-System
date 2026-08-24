<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeNotifications($request);
        $items = $request->user()->notifications()->latest()->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'Notifikasi berhasil dimuat.', 'data' => $items->items(), 'meta' => ['current_page' => $items->currentPage(), 'last_page' => $items->lastPage(), 'total' => $items->total()]]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $this->authorizeNotifications($request);

        return response()->json(['success' => true, 'message' => 'Unread count berhasil dimuat.', 'data' => ['count' => $request->user()->unreadNotifications()->count()]]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $this->authorizeNotifications($request);
        $item = $request->user()->notifications()->findOrFail($notification);
        $item->markAsRead();

        return response()->json(['success' => true, 'message' => 'Notifikasi ditandai dibaca.', 'data' => null]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $this->authorizeNotifications($request);
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true, 'message' => 'Semua notifikasi ditandai dibaca.', 'data' => null]);
    }

    private function authorizeNotifications(Request $request): void
    {
        abort_unless($request->user()->hasPermission('notification.view') || $request->user()->isSuperAdmin(), 403);
    }
}
