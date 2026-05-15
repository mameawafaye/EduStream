<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\ChapitreController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\InscriptionController;
use App\Http\Controllers\Api\VisionnageController;

/*
|--------------------------------------------------------------------------
| Routes publiques (sans authentification)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Routes protégées (token Sanctum requis)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | ADMIN — gestion des utilisateurs
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats',        [UserController::class, 'stats']);
        Route::get('/videos',       [VideoController::class, 'adminIndex']);
        Route::apiResource('/users', UserController::class);
    });

    // Alias sans préfixe pour le dashboard admin (compatibilité frontend)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users',         [UserController::class, 'index']);
        Route::post('/users',        [UserController::class, 'store']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::put('/users/{user}',  [UserController::class, 'update']);
    });

    /*
    |----------------------------------------------------------------------
    | MODULES — accessibles selon le rôle (logique dans le controller)
    |----------------------------------------------------------------------
    */
    Route::get('/modules',          [ModuleController::class, 'index']);
    Route::get('/modules/{module}', [ModuleController::class, 'show']);

    // Création et modification : enseignant ou admin
    Route::middleware('role:enseignant,admin')->group(function () {
        Route::post('/modules',                      [ModuleController::class, 'store']);
        Route::put('/modules/{module}',              [ModuleController::class, 'update']);
        Route::patch('/modules/{module}',            [ModuleController::class, 'update']);
        Route::delete('/modules/{module}',           [ModuleController::class, 'destroy']);
        Route::patch('/modules/{module}/publier',    [ModuleController::class, 'publier']);

        // Chapitres
        Route::get('/modules/{module}/chapitres',                          [ChapitreController::class, 'index']);
        Route::post('/modules/{module}/chapitres',                         [ChapitreController::class, 'store']);
        Route::put('/modules/{module}/chapitres/{chapitre}',               [ChapitreController::class, 'update']);
        Route::delete('/modules/{module}/chapitres/{chapitre}',            [ChapitreController::class, 'destroy']);

        // Vidéos (upload)
        Route::get('/modules/{module}/chapitres/{chapitre}/videos',        [VideoController::class, 'index']);
        Route::post('/modules/{module}/chapitres/{chapitre}/videos',       [VideoController::class, 'store']);
        Route::get('/modules/{module}/chapitres/{chapitre}/videos/{video}', [VideoController::class, 'show']);
        Route::put('/modules/{module}/chapitres/{chapitre}/videos/{video}', [VideoController::class, 'update']);
        Route::delete('/modules/{module}/chapitres/{chapitre}/videos/{video}', [VideoController::class, 'destroy']);

        // Étudiants inscrits à un module
        Route::get('/modules/{module}/etudiants', [InscriptionController::class, 'etudiants']);

        // Stats visionnage enseignant
        Route::get('/stats/visionnages', [VisionnageController::class, 'statsEnseignant']);
    });

    /*
    |----------------------------------------------------------------------
    | ÉTUDIANT — inscriptions et progression
    |----------------------------------------------------------------------
    */
    Route::middleware('role:etudiant')->group(function () {
        Route::get('/mes-inscriptions',              [InscriptionController::class, 'mesInscriptions']);
        Route::post('/modules/{module}/inscrire',    [InscriptionController::class, 'inscrire']);
        Route::delete('/modules/{module}/desinscrire', [InscriptionController::class, 'desinscrire']);
    });

    // Visionnage (étudiant uniquement)
    Route::middleware('role:etudiant')->group(function () {
        Route::post('/videos/{video}/visionnage',  [VisionnageController::class, 'upsert']);
        Route::get('/videos/{video}/visionnage',   [VisionnageController::class, 'show']);
    });
});
