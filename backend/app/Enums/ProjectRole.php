<?php

namespace App\Enums;

enum ProjectRole: string
{
    case MANAGER = 'manager';
    case MEMBER = 'member';
    case VIEWER = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::MANAGER => 'Manager',
            self::MEMBER => 'Member',
            self::VIEWER => 'Viewer',
        };
    }
}
