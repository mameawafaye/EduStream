<?php

namespace App\Support;

class YoutubeHelper
{
    /** Extrait l'identifiant vidéo depuis une URL YouTube */
    public static function extractId(string $url): ?string
    {
        $url = trim($url);

        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $url)) {
            return $url;
        }

        $patterns = [
            '/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    public static function isValidUrl(string $url): bool
    {
        return self::extractId($url) !== null;
    }

    public static function embedUrl(string $videoId): string
    {
        return 'https://www.youtube-nocookie.com/embed/' . $videoId . '?rel=0&modestbranding=1';
    }
}
