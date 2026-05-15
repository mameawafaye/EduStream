<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Video extends Model
{
    protected $fillable = [
        'titre',
        'duree',
        'url_stockage',
        'statut',
        'chapitre_id',
        'user_id',
    ];

    /** Chapitre parent */
    public function chapitre(): BelongsTo
    {
        return $this->belongsTo(Chapitre::class);
    }

    /** Enseignant qui a uploadé la vidéo */
    public function enseignant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Visionnages de cette vidéo */
    public function visionnages(): HasMany
    {
        return $this->hasMany(Visionnage::class);
    }
}
