<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectApprovalHistory extends Model
{
    protected $fillable = [
        'project_approval_id',
        'user_id',
        'action',
        'comment',
    ];

    public function approval(): BelongsTo
    {
        return $this->belongsTo(ProjectApproval::class, 'project_approval_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
