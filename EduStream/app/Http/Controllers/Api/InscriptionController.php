<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InscriptionController extends Controller
{
    /**
     * Modules auxquels l'étudiant connecté est inscrit,
     * avec progression calculée.
     */
    public function mesInscriptions(Request $request): JsonResponse
    {
        $user = $request->user();

        $modules = $user->modulesInscrits()
            ->where('statut', 'publie')
            ->withCount(['chapitres', 'videos'])
            ->with(['chapitres.videos'])
            ->get();

        // Calculer la progression pour chaque module
        $modules->transform(function ($module) use ($user) {
            $totalVideos = $module->videos_count;

            $videosVues = 0;
            if ($totalVideos > 0) {
                // IDs des vidéos du module
                $videoIds = $module->chapitres->flatMap(fn($c) => $c->videos->pluck('id'));

                $videosVues = $user->visionnages()
                    ->whereIn('video_id', $videoIds)
                    ->where('termine', true)
                    ->count();
            }

            $module->nb_chapitres  = $module->chapitres_count;
            $module->nb_videos     = $totalVideos;
            $module->videos_vues   = $videosVues;
            $module->progression   = $totalVideos > 0
                ? (int) round(($videosVues / $totalVideos) * 100)
                : 0;

            return $module;
        });

        return response()->json($modules);
    }

    /** S'inscrire à un module (étudiant) */
    public function inscrire(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        if ($module->statut !== 'publie') {
            return response()->json(['message' => 'Ce module n\'est pas disponible.'], 422);
        }

        // Vérifier si déjà inscrit
        if ($user->modulesInscrits()->where('module_id', $module->id)->exists()) {
            return response()->json(['message' => 'Vous êtes déjà inscrit à ce module.'], 422);
        }

        $user->modulesInscrits()->attach($module->id);

        return response()->json(['message' => 'Inscription réussie.'], 201);
    }

    /** Se désinscrire d'un module (étudiant) */
    public function desinscrire(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        $user->modulesInscrits()->detach($module->id);

        return response()->json(['message' => 'Désinscription effectuée.']);
    }

    /** Liste des étudiants inscrits à un module (enseignant/admin) */
    public function etudiants(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $etudiants = $module->etudiants()
            ->select('users.id', 'users.name', 'users.email', 'inscriptions.created_at as inscrit_le')
            ->get();

        return response()->json($etudiants);
    }
}
