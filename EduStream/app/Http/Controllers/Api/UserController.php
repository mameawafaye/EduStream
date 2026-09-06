<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** Liste tous les utilisateurs (admin) */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json($users);
    }

    /** Créer un utilisateur (admin) */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:admin,enseignant,etudiant',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
        ]);

        return response()->json($user, 201);
    }

    /** Afficher un utilisateur */
    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    /** Modifier un utilisateur (admin) */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'role'  => 'sometimes|in:admin,enseignant,etudiant',
        ]);

        $user->update($data);

        return response()->json($user);
    }

    /** Supprimer un utilisateur (admin) */
    public function destroy(User $user): JsonResponse
    {
        // Empêcher la suppression de son propre compte
        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }

    /** Statistiques globales (admin) */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total'       => User::count(),
            'etudiants'   => User::where('role', 'etudiant')->count(),
            'enseignants' => User::where('role', 'enseignant')->count(),
            'admins'      => User::where('role', 'admin')->count(),
        ]);
    }
}
