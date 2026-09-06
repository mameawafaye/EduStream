<?php

namespace App\Support;

use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Collection;

class ProgressionHelper
{
    /**
     * Calcule la progression d'un module (0–100) en tenant compte
     * des vidéos terminées et des visionnages partiels.
     *
     * @return array{progression: int, videos_vues: int}
     */
    public static function forModule(User $user, Collection $videos, int $totalVideos): array
    {
        if ($totalVideos === 0) {
            return ['progression' => 0, 'videos_vues' => 0];
        }

        $videoIds = $videos->pluck('id');
        $visionnages = $user->visionnages()
            ->whereIn('video_id', $videoIds)
            ->get()
            ->keyBy('video_id');

        $totalFraction = 0.0;
        $videosVues = 0;

        foreach ($videos as $video) {
            $visionnage = $visionnages->get($video->id);
            if (! $visionnage) {
                continue;
            }

            if ($visionnage->termine) {
                $totalFraction += 1.0;
                $videosVues++;
            } elseif ($video->duree > 0 && $visionnage->position > 0) {
                $totalFraction += min($visionnage->position / $video->duree, 0.99);
            }
        }

        return [
            'progression'  => (int) round(($totalFraction / $totalVideos) * 100),
            'videos_vues'  => $videosVues,
        ];
    }

    /** Fraction de complétion d'une vidéo (0.0 – 1.0) */
    public static function videoFraction(Video $video, ?object $visionnage): float
    {
        if (! $visionnage) {
            return 0.0;
        }

        if ($visionnage->termine) {
            return 1.0;
        }

        if ($video->duree > 0 && $visionnage->position > 0) {
            return min($visionnage->position / $video->duree, 0.99);
        }

        return 0.0;
    }
}
