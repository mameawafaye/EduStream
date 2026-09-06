<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapitre;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapitreController extends Controller
{
    /** Liste les chapitres d'un module */
    public function index(Request $request, Module $module): JsonResponse
    {
        if ($denied = $this->ensureCanViewModule($request, $module)) {
            return $denied;
        }

        $chapitres = $module->chapitres()->with('videos')->get();

        return response()->json($chapitres);
    }

    /** Créer un chapitre dans un module (enseignant propriétaire ou admin) */
    public function store(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate([
            'titre' => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:1',
        ]);

        // Ordre automatique si non fourni
        if (empty($data['ordre'])) {
            $data['ordre'] = $module->chapitres()->max('ordre') + 1;
        }

        $chapitre = $module->chapitres()->create($data);

        return response()->json($chapitre, 201);
    }

    /** Modifier un chapitre */
    public function update(Request $request, Module $module, Chapitre $chapitre): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'ordre' => 'sometimes|integer|min:1',
        ]);

        $chapitre->update($data);

        return response()->json($chapitre);
    }

    /** Supprimer un chapitre */
    public function destroy(Request $request, Module $module, Chapitre $chapitre): JsonResponse
    {
        $user = $request->user();

        if ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $chapitre->delete();

        return response()->json(['message' => 'Chapitre supprimé avec succès.']);
    }

    private function ensureCanViewModule(Request $request, Module $module): ?JsonResponse
    {
        $user = $request->user();

        if ($user->isEtudiant()) {
            if ($module->statut !== 'publie') {
                return response()->json(['message' => 'Ce module n\'est pas disponible.'], 403);
            }

            if (! $user->modulesInscrits()->where('module_id', $module->id)->exists()) {
                return response()->json(['message' => 'Vous devez être inscrit à ce module.'], 403);
            }
        } elseif ($user->isEnseignant() && $module->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return null;
    }
}
