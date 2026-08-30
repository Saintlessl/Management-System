<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'team_id',
        'project_id',
        'private_key',
        'created_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function isPrivate(): bool
    {
        return $this->type === 'private';
    }

    public function isTeam(): bool
    {
        return $this->type === 'team';
    }

    public function isProject(): bool
    {
        return $this->type === 'project';
    }

    public function getUnreadCountFor(User $user): int
    {
        $participant = $this->conversationParticipants()
            ->where('user_id', $user->id)
            ->first();

        if (! $participant || ! $participant->last_read_at) {
            return $this->messages()->where('user_id', '!=', $user->id)->count();
        }

        return $this->messages()
            ->where('user_id', '!=', $user->id)
            ->where('created_at', '>', $participant->last_read_at)
            ->count();
    }

    public function markAsReadFor(User $user): void
    {
        $this->conversationParticipants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);
    }

    /**
     * Find or create a private conversation between two users.
     */
    public static function findOrCreatePrivate(int $userId1, int $userId2, int $createdBy): self
    {
        [$firstUserId, $secondUserId] = $userId1 < $userId2
            ? [$userId1, $userId2]
            : [$userId2, $userId1];
        $privateKey = "{$firstUserId}:{$secondUserId}";

        return DB::transaction(function () use ($firstUserId, $secondUserId, $createdBy, $privateKey) {
            $conversation = self::query()->firstOrCreate(
                ['type' => 'private', 'private_key' => $privateKey],
                ['created_by' => $createdBy],
            );

            $conversation->conversationParticipants()->firstOrCreate(
                ['user_id' => $firstUserId],
                ['last_read_at' => $firstUserId === $createdBy ? now() : null],
            );
            $conversation->conversationParticipants()->firstOrCreate(
                ['user_id' => $secondUserId],
                ['last_read_at' => $secondUserId === $createdBy ? now() : null],
            );

            return $conversation;
        });
    }
}
