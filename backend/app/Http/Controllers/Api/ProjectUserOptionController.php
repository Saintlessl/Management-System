<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ProjectUserOptionController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('create', Project::class);

        return response()->json([
            'success' => true,
            'message' => 'Pilihan pengguna berhasil dimuat.',
            'data' => User::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }
}
