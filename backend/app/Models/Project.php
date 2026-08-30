<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
        'priority',
        'start_date',
        'deadline',
        'project_manager_id',
        'team_id',
        'completion_submitted_at',
        'completed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'priority' => TaskPriority::class,
            'start_date' => 'date',
            'deadline' => 'date',
            'completion_submitted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    // Relationships
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('project_role', 'joined_at');
    }

    public function projectMembers(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(ProjectApproval::class);
    }

    public function conversation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Conversation::class)->where('type', 'project');
    }

    // Computed
    public function getProgressAttribute(): float
    {
        $total = $this->tasks()->count();
        if ($total === 0) {
            return 0;
        }

        $done = $this->tasks()->where('status', TaskStatus::DONE)->count();

        return round(($done / $total) * 100, 1);
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->deadline
            && $this->deadline->isPast()
            && ! in_array($this->status, [ProjectStatus::COMPLETED, ProjectStatus::CANCELLED]);
    }
}
