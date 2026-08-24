<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::query()->orderBy('group')->orderBy('name')->get();

        return response()->json(['success' => true, 'message' => 'Daftar permission berhasil dimuat.', 'data' => PermissionResource::collection($permissions)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255', 'unique:permissions,name'], 'slug' => ['nullable', 'string', 'max:255'], 'group' => ['nullable', 'string', 'max:100'], 'description' => ['nullable', 'string', 'max:1000']]);
        $data['slug'] = Str::slug($data['slug'] ?: $data['name'], '.');
        abort_if(Permission::where('slug', $data['slug'])->exists(), 422, 'Slug permission sudah digunakan.');
        $permission = Permission::create($data);

        return response()->json(['success' => true, 'message' => 'Permission berhasil dibuat.', 'data' => new PermissionResource($permission)], 201);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        $data = $request->validate(['name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('permissions', 'name')->ignore($permission)], 'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('permissions', 'slug')->ignore($permission)], 'group' => ['nullable', 'string', 'max:100'], 'description' => ['nullable', 'string', 'max:1000']]);
        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug'], '.');
        }
        $permission->update($data);

        return response()->json(['success' => true, 'message' => 'Permission berhasil diperbarui.', 'data' => new PermissionResource($permission)]);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        abort_if($permission->roles()->where('slug', 'super-admin')->exists(), 409, 'Permission sistem tidak dapat dihapus.');
        abort_if($permission->roles()->exists(), 409, 'Permission masih digunakan oleh role.');
        $permission->delete();

        return response()->json(['success' => true, 'message' => 'Permission berhasil dihapus.', 'data' => null]);
    }
}
