<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visionnage extends Model
{
    protected $fillable = [
        'user_id',
        'video_id',
        'position',
        'termine',
    ];

    protected $casts = [
        'termine' => 'boolean',
    ];

    /** Étudiant qui visionne */
    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Vidéo visionnée */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
