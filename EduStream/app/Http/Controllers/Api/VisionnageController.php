<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\Visionnage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisionnageController extends Controller
{
    /**
     * Enregistre ou met à jour la progression d'un étudiant sur une vidéo.
     * - termine : une fois true, ne repasse jamais à false
     * - position : conserve toujours la valeur maximale atteinte
     */
    public function upsert(Request $request, Video $video): JsonResponse
    {
        if ($denied = $this->ensureEtudiantInscrit($request, $video)) {
            return $denied;
        }

        $request->validate([
            'position' => 'required|integer|min:0',
            'termine'  => 'required|boolean',
        ]);

        $existing = Visionnage::where('user_id', $request->user()->id)
            ->where('video_id', $video->id)
            ->first();

        $position = max($request->integer('position'), $existing?->position ?? 0);
        $termine  = ($existing?->termine ?? false) || $request->boolean('termine');

        $visionnage = Visionnage::updateOrCreate(
            [
                'user_id'  => $request->user()->id,
                'video_id' => $video->id,
            ],
            [
                'position' => $position,
                'termine'  => $termine,
            ]
        );

        return response()->json($visionnage);
    }

    /**
     * Retourne la progression de l'utilisateur sur une vidéo.
     */
    public function show(Request $request, Video $video): JsonResponse
    {
        if ($denied = $this->ensureEtudiantInscrit($request, $video)) {
            return $denied;
        }

        $visionnage = Visionnage::where('user_id', $request->user()->id)
            ->where('video_id', $video->id)
            ->first();

        return response()->json($visionnage ?? ['position' => 0, 'termine' => false]);
    }

    /**
     * Statistiques de visionnage pour un enseignant (ses vidéos).
     */
    public function statsEnseignant(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalVisionnages = Visionnage::whereHas('video', fn($q) => $q->where('user_id', $user->id))->count();
        $termines         = Visionnage::whereHas('video', fn($q) => $q->where('user_id', $user->id))
                                ->where('termine', true)->count();

        return response()->json([
            'total_visionnages' => $totalVisionnages,
            'termines'          => $termines,
        ]);
    }

    /** Vérifie que l'étudiant est inscrit au module contenant la vidéo */
    private function ensureEtudiantInscrit(Request $request, Video $video): ?JsonResponse
    {
        $video->loadMissing('chapitre.module');
        $module = $video->chapitre?->module;

        if (! $module) {
            return response()->json(['message' => 'Vidéo introuvable.'], 404);
        }

        if ($module->statut !== 'publie') {
            return response()->json(['message' => 'Ce module n\'est pas disponible.'], 403);
        }

        if (! $request->user()->modulesInscrits()->where('module_id', $module->id)->exists()) {
            return response()->json(['message' => 'Vous devez être inscrit à ce module.'], 403);
        }

        return null;
    }
}
