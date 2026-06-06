<?php

namespace App\Models;

use App\Support\YoutubeHelper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Video extends Model
{
    protected $appends = ['url_publique', 'youtube_embed_url'];

    protected $fillable = [
        'titre',
        'description',
        'source_type',
        'youtube_id',
        'duree',
        'url_stockage',
        'statut',
        'chapitre_id',
        'user_id',
    ];

    public function isYoutube(): bool
    {
        return $this->source_type === 'youtube';
    }

    public function isUpload(): bool
    {
        return $this->source_type === 'upload';
    }

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

    public function getUrlPubliqueAttribute(): ?string
    {
        if ($this->isYoutube() || ! $this->url_stockage) {
            return null;
        }

        if (str_starts_with($this->url_stockage, 'http')) {
            return $this->url_stockage;
        }

        return url('storage/' . $this->url_stockage);
    }

    public function getYoutubeEmbedUrlAttribute(): ?string
    {
        if (! $this->youtube_id) {
            return null;
        }

        return YoutubeHelper::embedUrl($this->youtube_id);
    }
}
