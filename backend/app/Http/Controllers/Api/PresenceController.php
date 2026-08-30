<?php

namespace App\Http\Controllers\Api;

use App\Events\PresenceUpdatedBroadcast;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $user = $request->user();
        User::where('id', $user->id)->update(['is_online' => true]);
        broadcast(new PresenceUpdatedBroadcast($user->id, $user->name, true));

        return response()->json(['success' => true, 'message' => 'Kehadiran diperbarui.']);
    }

    public function offline(Request $request): JsonResponse
    {
        $user = $request->user();
        User::where('id', $user->id)->update(['is_online' => false]);
        broadcast(new PresenceUpdatedBroadcast($user->id, $user->name, false));

        return response()->json(['success' => true, 'message' => 'Status offline dicatat.']);
    }
}
