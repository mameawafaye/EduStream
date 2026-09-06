<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapitre extends Model
{
    protected $fillable = [
        'titre',
        'ordre',
        'module_id',
    ];

    /** Module parent */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /** Vidéos du chapitre */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }
}
