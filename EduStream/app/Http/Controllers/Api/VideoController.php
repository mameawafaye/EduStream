<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapitre;
use App\Models\Module;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VideoController extends Controller
{
    /** Liste les vidéos d'un chapitre */
    public function index(Module $module, Chapitre $chapitre): JsonResponse
    {
        $videos = $chapitre->videos()->orderBy('created_at')->get()->map(function ($v) {
            $v->url_publique = $this->urlPublique($v->url_stockage);
            return $v;
        });
        return response()->json($videos);
    }

    /**
     * Upload une vidéo dans un chapitre.
     * Accepte multipart/form-data avec le champ "video".
     */
    public function store(Request $request, Module $module, Chapitre $chapitre): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $request->validate([
            'titre' => 'required|string|max:255',
            'video' => 'required|file|mimetypes:video/mp4,video/webm,video/ogg,video/quicktime|max:512000',
            'duree' => 'nullable|integer|min:0',
        ]);

        $file = $request->file('video');
        $path = $file->store('videos', 'public');

        // Durée en secondes si non fournie
        $duree = $request->duree;

        $video = Video::create([
            'titre'        => $request->titre,
            'duree'        => $duree,
            'url_stockage' => $path,          // chemin relatif ex: videos/abc.mp4
            'statut'       => 'disponible',
            'chapitre_id'  => $chapitre->id,
            'user_id'      => $user->id,
        ]);

        $video->url_publique = $this->urlPublique($path);

        return response()->json($video, 201);
    }

    /** Afficher une vidéo avec son URL publique */
    public function show(Module $module, Chapitre $chapitre, Video $video): JsonResponse
    {
        $video->url_publique = $this->urlPublique($video->url_stockage);
        return response()->json($video);
    }

    /** Modifier le titre ou le statut d'une vidéo */
    public function update(Request $request, Module $module, Chapitre $chapitre, Video $video): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate([
            'titre'  => 'sometimes|string|max:255',
            'statut' => 'sometimes|in:en_traitement,disponible',
        ]);

        $video->update($data);
        $video->url_publique = $this->urlPublique($video->url_stockage);

        return response()->json($video);
    }

    /** Supprimer une vidéo et son fichier */
    public function destroy(Request $request, Module $module, Chapitre $chapitre, Video $video): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Supprimer le fichier physique
        if (Storage::disk('public')->exists($video->url_stockage)) {
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
            ->get()
            ->map(function ($v) {
                $v->url_publique = $this->urlPublique($v->url_stockage);
                return $v;
            });

        return response()->json($videos);
    }

    /** Construit l'URL publique à partir du chemin stocké */
    private function urlPublique(string $path): string
    {
        // Si déjà une URL complète, la retourner telle quelle
        if (str_starts_with($path, 'http')) {
            return $path;
        }
        return url('storage/' . $path);
    }
}
