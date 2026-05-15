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
     * Crée le visionnage s'il n'existe pas encore (upsert).
     */
    public function upsert(Request $request, Video $video): JsonResponse
    {
        $request->validate([
            'position' => 'required|integer|min:0',
            'termine'  => 'required|boolean',
        ]);

        $visionnage = Visionnage::updateOrCreate(
            [
                'user_id'  => $request->user()->id,
                'video_id' => $video->id,
            ],
            [
                'position' => $request->position,
                'termine'  => $request->termine,
            ]
        );

        return response()->json($visionnage);
    }

    /**
     * Retourne la progression de l'utilisateur sur une vidéo.
     */
    public function show(Request $request, Video $video): JsonResponse
    {
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
}
