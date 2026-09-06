<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    /** Modules créés par cet enseignant */
    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }

    /** Modules auxquels cet étudiant est inscrit */
    public function modulesInscrits(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'inscriptions')->withTimestamps();
    }

    /** Visionnages de cet utilisateur */
    public function visionnages(): HasMany
    {
        return $this->hasMany(Visionnage::class);
    }

    /** Vidéos uploadées par cet enseignant */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    // Helpers de rôle
    public function isAdmin(): bool      { return $this->role === 'admin'; }
    public function isEnseignant(): bool { return $this->role === 'enseignant'; }
    public function isEtudiant(): bool   { return $this->role === 'etudiant'; }
}
