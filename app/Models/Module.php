<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Module extends Model
{
    protected $fillable = [
        'titre',
        'description',
        'matiere',
        'statut',
        'user_id',
    ];

    /** Enseignant propriétaire du module */
    public function enseignant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Chapitres du module */
    public function chapitres(): HasMany
    {
        return $this->hasMany(Chapitre::class)->orderBy('ordre');
    }

    /** Étudiants inscrits au module */
    public function etudiants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'inscriptions')->withTimestamps();
    }

    /** Toutes les vidéos du module (via chapitres) */
    public function videos(): HasManyThrough
    {
        return $this->hasManyThrough(Video::class, Chapitre::class);
    }

    /** Nombre de chapitres */
    public function getNbChapitresAttribute(): int
    {
        return $this->chapitres()->count();
    }

    /** Nombre de vidéos */
    public function getNbVideosAttribute(): int
    {
        return $this->videos()->count();
    }

    /** Nombre d'étudiants inscrits */
    public function getNbEtudiantsAttribute(): int
    {
        return $this->etudiants()->count();
    }
}
