<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('audit.view') || $request->user()->isSuperAdmin(), 403);
        $data = $request->validate(['action' => ['nullable', 'string', 'max:100'], 'entity_type' => ['nullable', 'string', 'max:255'], 'user_id' => ['nullable', 'integer', 'exists:users,id'], 'from' => ['nullable', 'date'], 'to' => ['nullable', 'date'], 'per_page' => ['nullable', 'integer', 'min:5', 'max:100']]);
        $items = AuditLog::query()->with('user')
            ->when($data['action'] ?? null, fn (Builder $q, string $v) => $q->where('action', $v))
            ->when($data['entity_type'] ?? null, fn (Builder $q, string $v) => $q->where('entity_type', $v))
            ->when($data['user_id'] ?? null, fn (Builder $q, int $v) => $q->where('user_id', $v))
            ->when($data['from'] ?? null, fn (Builder $q, string $v) => $q->whereDate('created_at', '>=', $v))
            ->when($data['to'] ?? null, fn (Builder $q, string $v) => $q->whereDate('created_at', '<=', $v))
            ->latest('id')->paginate($data['per_page'] ?? 20);

        return response()->json(['success' => true, 'message' => 'Audit log berhasil dimuat.', 'data' => $items->items(), 'meta' => ['current_page' => $items->currentPage(), 'last_page' => $items->lastPage(), 'total' => $items->total()]]);
    }
}
