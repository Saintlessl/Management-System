<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RoleOptionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Pilihan role berhasil dimuat.',
            'data' => Role::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }
}
