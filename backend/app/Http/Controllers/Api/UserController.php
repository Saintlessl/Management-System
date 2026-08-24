<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\IndexUserRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(IndexUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $users = User::query()
            ->with('roles.permissions')
            ->when($validated['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when(array_key_exists('is_active', $validated), fn (Builder $query) => $query->where('is_active', $validated['is_active']))
            ->when($validated['role_id'] ?? null, fn (Builder $query, int $roleId) => $query->whereHas('roles', fn (Builder $query) => $query->whereKey($roleId)))
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengguna berhasil dimuat.',
            'data' => UserResource::collection($users->getCollection())->resolve(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'from' => $users->firstItem(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'to' => $users->lastItem(),
                'total' => $users->total(),
                'path' => $users->path(),
                'links' => $users->linkCollection()->values()->all(),
            ],
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data) {
            $user = User::create(Arr::only($data, [
                'name',
                'email',
                'password',
                'is_active',
            ]));
            $user->roles()->sync($data['role_ids'] ?? []);

            return $user;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dibuat.',
            'data' => new UserResource($user->load('roles.permissions')),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dimuat.',
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        $roleIds = $data['role_ids'] ?? null;

        $result = DB::transaction(function () use ($request, $user, $data, $roleIds) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $willBeActive = $data['is_active'] ?? $lockedUser->is_active;

            if ($request->user()->is($lockedUser) && ! $willBeActive) {
                return 'Anda tidak dapat menonaktifkan akun sendiri.';
            }

            if ($request->user()->is($lockedUser) && $this->removesOwnSuperAdminRole($lockedUser, $roleIds)) {
                return 'Anda tidak dapat mencabut role super-admin dari akun sendiri.';
            }

            if ($this->wouldRemoveLastActiveSuperAdmin($lockedUser, $willBeActive, $roleIds)) {
                return 'Sistem harus memiliki setidaknya satu super admin aktif.';
            }

            $attributes = Arr::only($data, [
                'name',
                'email',
                'password',
                'is_active',
            ]);

            if (empty($attributes['password'])) {
                unset($attributes['password']);
            }

            $lockedUser->update($attributes);

            if ($roleIds !== null) {
                $lockedUser->roles()->sync($roleIds);
            }

            return null;
        });

        if ($result) {
            return $this->conflict($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil diperbarui.',
            'data' => new UserResource($user->fresh()->load('roles.permissions')),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $user) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($request->user()->is($lockedUser)) {
                return 'Anda tidak dapat menghapus akun sendiri.';
            }

            if ($this->wouldRemoveLastActiveSuperAdmin($lockedUser, false, [])) {
                return 'Sistem harus memiliki setidaknya satu super admin aktif.';
            }

            if ($lockedUser->reportedTasks()->exists() || $lockedUser->createdProjects()->exists()) {
                return 'Pengguna memiliki riwayat project atau task dan tidak dapat dihapus. Nonaktifkan akun sebagai gantinya.';
            }

            $lockedUser->delete();

            return null;
        });

        if ($result) {
            return $this->conflict($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
            'data' => null,
        ]);
    }

    private function removesOwnSuperAdminRole(User $user, ?array $roleIds): bool
    {
        if ($roleIds === null || ! $user->hasRole('super-admin')) {
            return false;
        }

        $superAdminRoleId = Role::query()->where('slug', 'super-admin')->value('id');

        return ! in_array($superAdminRoleId, $roleIds, true);
    }

    private function wouldRemoveLastActiveSuperAdmin(User $user, bool $willBeActive, ?array $roleIds): bool
    {
        if (! $user->is_active || ! $user->hasRole('super-admin')) {
            return false;
        }

        $superAdminRoleId = Role::query()->where('slug', 'super-admin')->value('id');
        $willRemainSuperAdmin = $roleIds === null || in_array($superAdminRoleId, $roleIds, true);

        if ($willBeActive && $willRemainSuperAdmin) {
            return false;
        }

        return User::query()
            ->where('is_active', true)
            ->whereHas('roles', fn (Builder $query) => $query->where('slug', 'super-admin'))
            ->lockForUpdate()
            ->count() <= 1;
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
