<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inscription extends Model
{
    protected $fillable = [
        'user_id',
        'module_id',
    ];

    /** Étudiant inscrit */
    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Module concerné */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
