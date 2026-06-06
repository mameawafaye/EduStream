<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapitre;
use App\Models\Module;
use App\Models\Video;
use App\Support\YoutubeHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VideoController extends Controller
{
    /** Liste les vidéos d'un chapitre */
    public function index(Module $module, Chapitre $chapitre): JsonResponse
    {
        $videos = $chapitre->videos()->orderBy('created_at')->get();

        return response()->json($videos);
    }

    /**
     * Ajoute une vidéo dans un chapitre.
     * Fournir un lien YouTube et/ou un fichier — au moins l'un des deux est requis.
     * Si les deux sont fournis, le lien YouTube est prioritaire.
     */
    public function store(Request $request, Module $module, Chapitre $chapitre): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $base = $request->validate([
            'titre'       => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'youtube_url' => 'nullable|string|max:500',
            'duree'       => 'nullable|integer|min:0',
            'video'       => 'nullable|file|mimetypes:video/mp4,video/webm,video/ogg,video/quicktime|max:512000',
        ]);

        $youtubeId = ! empty($base['youtube_url'])
            ? YoutubeHelper::extractId($base['youtube_url'])
            : null;

        if ($youtubeId) {
            $video = Video::create([
                'titre'        => $base['titre'],
                'description'  => $base['description'] ?? null,
                'source_type'  => 'youtube',
                'youtube_id'   => $youtubeId,
                'url_stockage' => $base['youtube_url'],
                'duree'        => $base['duree'] ?? null,
                'statut'       => 'disponible',
                'chapitre_id'  => $chapitre->id,
                'user_id'      => $user->id,
            ]);

            return response()->json($video->fresh(), 201);
        }

        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('videos', 'public');

            $video = Video::create([
                'titre'        => $base['titre'],
                'description'  => $base['description'] ?? null,
                'source_type'  => 'upload',
                'youtube_id'   => null,
                'url_stockage' => $path,
                'duree'        => $base['duree'] ?? null,
                'statut'       => 'disponible',
                'chapitre_id'  => $chapitre->id,
                'user_id'      => $user->id,
            ]);

            return response()->json($video->fresh(), 201);
        }

        if (! empty($base['youtube_url'])) {
            return response()->json([
                'message' => 'Lien YouTube invalide. Utilisez un lien youtube.com ou youtu.be.',
            ], 422);
        }

        return response()->json([
            'message' => 'Veuillez fournir un lien YouTube ou un fichier vidéo.',
        ], 422);
    }

    /** Afficher une vidéo */
    public function show(Module $module, Chapitre $chapitre, Video $video): JsonResponse
    {
        return response()->json($video);
    }

    /** Modifier une vidéo (titre, description, lien YouTube ou fichier) */
    public function update(Request $request, Module $module, Chapitre $chapitre, Video $video): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $rules = [
            'titre'       => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'statut'      => 'sometimes|in:en_traitement,disponible',
            'duree'       => 'nullable|integer|min:0',
        ];

        if ($video->isYoutube()) {
            $rules['youtube_url'] = 'sometimes|string|max:500';
        } else {
            $rules['video'] = 'sometimes|file|mimetypes:video/mp4,video/webm,video/ogg,video/quicktime|max:512000';
        }

        $data = $request->validate($rules);

        if (isset($data['youtube_url'])) {
            $youtubeId = YoutubeHelper::extractId($data['youtube_url']);

            if (! $youtubeId) {
                return response()->json(['message' => 'Lien YouTube invalide.'], 422);
            }

            $video->youtube_id   = $youtubeId;
            $video->url_stockage = $data['youtube_url'];
            unset($data['youtube_url']);
        }

        if ($request->hasFile('video')) {
            if ($video->isUpload() && Storage::disk('public')->exists($video->url_stockage)) {
                Storage::disk('public')->delete($video->url_stockage);
            }

            $video->url_stockage = $request->file('video')->store('videos', 'public');
            unset($data['video']);
        }

        $video->update(collect($data)->except(['video', 'youtube_url'])->toArray());

        return response()->json($video->fresh());
    }

    /** Supprimer une vidéo (fichier local uniquement si upload) */
    public function destroy(Request $request, Module $module, Chapitre $chapitre, Video $video): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($video->isUpload() && Storage::disk('public')->exists($video->url_stockage)) {
            Storage::disk('public')->delete($video->url_stockage);
        }

        $video->delete();

        return response()->json(['message' => 'Vidéo supprimée avec succès.']);
    }

    /** Liste toutes les vidéos (admin) */
    public function adminIndex(): JsonResponse
    {
        $videos = Video::with(['chapitre.module', 'enseignant:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($videos);
    }
}
