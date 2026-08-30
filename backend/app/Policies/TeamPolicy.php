<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('team.view');
    }

    public function view(User $user, Team $team): bool
    {
        return $user->hasPermission('team.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('team.create');
    }

    public function update(User $user, Team $team): bool
    {
        return $user->hasPermission('team.update');
    }

    public function delete(User $user, Team $team): bool
    {
        return $user->hasPermission('team.delete');
    }

    public function manageMembers(User $user, Team $team): bool
    {
        return $user->hasPermission('team.manage_members');
    }
}
