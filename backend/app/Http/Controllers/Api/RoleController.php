<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->with('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar role berhasil dimuat.',
            'data' => RoleResource::collection($roles),
        ]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);

        $role = DB::transaction(function () use ($data) {
            $role = Role::create(Arr::except($data, ['permission_ids']));
            $role->permissions()->sync($data['permission_ids'] ?? []);

            return $role;
        });

        return response()->json([
            'success' => true,
            'message' => 'Role berhasil dibuat.',
            'data' => new RoleResource($role->load('permissions')->loadCount('users')),
        ], 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Role berhasil dimuat.',
            'data' => new RoleResource($role->load('permissions')->loadCount('users')),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        if ($role->slug === 'super-admin') {
            return $this->conflict('Role super-admin tidak dapat diubah.');
        }

        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        DB::transaction(function () use ($role, $data) {
            $role->update(Arr::except($data, ['permission_ids']));

            if (array_key_exists('permission_ids', $data)) {
                $role->permissions()->sync($data['permission_ids']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Role berhasil diperbarui.',
            'data' => new RoleResource($role->fresh()->load('permissions')->loadCount('users')),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->slug === 'super-admin') {
            return $this->conflict('Role super-admin tidak dapat dihapus.');
        }

        if ($role->users()->exists()) {
            return $this->conflict('Role masih digunakan oleh pengguna dan tidak dapat dihapus.');
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role berhasil dihapus.',
            'data' => null,
        ]);
    }

    private function conflict(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
        ], 409);
    }
}
