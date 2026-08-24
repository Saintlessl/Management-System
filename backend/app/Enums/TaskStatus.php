<?php

namespace App\Enums;

enum TaskStatus: string
{
    case BACKLOG = 'backlog';
    case TODO = 'todo';
    case IN_PROGRESS = 'in_progress';
    case REVIEW = 'review';
    case DONE = 'done';

    public function label(): string
    {
        return match ($this) {
            self::BACKLOG => 'Backlog',
            self::TODO => 'To Do',
            self::IN_PROGRESS => 'In Progress',
            self::REVIEW => 'Review',
            self::DONE => 'Done',
        };
    }

    public static function allowedTransitions(): array
    {
        return [
            self::BACKLOG->value => [self::TODO->value],
            self::TODO->value => [self::IN_PROGRESS->value],
            self::IN_PROGRESS->value => [self::REVIEW->value],
            self::REVIEW->value => [self::DONE->value, self::IN_PROGRESS->value],
            self::DONE->value => [],
        ];
    }

    public function canTransitionTo(self $target): bool
    {
        $allowed = self::allowedTransitions()[$this->value] ?? [];

        return in_array($target->value, $allowed);
    }
}
