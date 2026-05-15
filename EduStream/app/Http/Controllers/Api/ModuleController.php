<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    /**
     * Liste les modules.
     * - Admin    : tous les modules
     * - Enseignant : ses propres modules
     * - Étudiant : modules publiés
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Module::with(['enseignant:id,name', 'chapitres'])
            ->withCount(['chapitres', 'videos', 'etudiants']);

        if ($user->isAdmin()) {
            // Tous les modules
        } elseif ($user->isEnseignant()) {
            $query->where('user_id', $user->id);
        } else {
            // Étudiant : uniquement les publiés
            $query->where('statut', 'publie');
        }

        $modules = $query->orderBy('created_at', 'desc')->get();

        // Renommer les colonnes withCount pour correspondre au frontend
        $modules->transform(function ($m) {
            $m->nb_chapitres = $m->chapitres_count;
            $m->nb_videos    = $m->videos_count;
            $m->nb_etudiants = $m->etudiants_count;
            return $m;
        });

        return response()->json($modules);
    }

    /** Créer un module (enseignant) */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titre'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'matiere'     => 'nullable|string|max:100',
        ]);

        $module = Module::create([
            ...$data,
            'user_id' => $request->user()->id,
            'statut'  => 'brouillon',
        ]);

        return response()->json($module->load('enseignant:id,name'), 201);
    }

    /** Afficher un module avec ses chapitres et vidéos */
    public function show(Module $module): JsonResponse
    {
        $module->load(['enseignant:id,name', 'chapitres.videos']);
        $module->nb_chapitres = $module->chapitres->count();
        $module->nb_videos    = $module->videos()->count();
        $module->nb_etudiants = $module->etudiants()->count();

        return response()->json($module);
    }

    /** Modifier un module (enseignant propriétaire ou admin) */
    public function update(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate([
            'titre'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'matiere'     => 'nullable|string|max:100',
            'statut'      => 'sometimes|in:brouillon,publie',
        ]);

        $module->update($data);

        return response()->json($module);
    }

    /** Publier un module (enseignant propriétaire ou admin) */
    public function publier(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $module->update(['statut' => 'publie']);

        return response()->json(['message' => 'Module publié avec succès.', 'module' => $module]);
    }

    /** Supprimer un module (enseignant propriétaire ou admin) */
    public function destroy(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $module->delete();

        return response()->json(['message' => 'Module supprimé avec succès.']);
    }
}
