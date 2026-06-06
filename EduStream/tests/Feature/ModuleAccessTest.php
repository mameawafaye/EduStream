<?php

namespace Tests\Feature;

use App\Models\Chapitre;
use App\Models\Module;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModuleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function createPublishedModuleWithVideo(): array
    {
        $enseignant = User::factory()->create(['role' => 'enseignant']);
        $module = Module::create([
            'titre'       => 'Module Test',
            'description' => 'Description',
            'statut'      => 'publie',
            'user_id'     => $enseignant->id,
        ]);
        $chapitre = Chapitre::create([
            'titre'     => 'Chapitre 1',
            'ordre'     => 1,
            'module_id' => $module->id,
        ]);
        $video = Video::create([
            'titre'        => 'Vidéo 1',
            'duree'        => 120,
            'url_stockage' => 'videos/test.webm',
            'statut'       => 'disponible',
            'chapitre_id'  => $chapitre->id,
            'user_id'      => $enseignant->id,
        ]);

        return compact('enseignant', 'module', 'chapitre', 'video');
    }

    public function test_student_cannot_view_unenrolled_module(): void
    {
        $data = $this->createPublishedModuleWithVideo();
        $etudiant = User::factory()->create(['role' => 'etudiant']);
        Sanctum::actingAs($etudiant);

        $response = $this->getJson('/api/modules/' . $data['module']->id);

        $response->assertForbidden();
    }

    public function test_student_can_view_enrolled_module(): void
    {
        $data = $this->createPublishedModuleWithVideo();
        $etudiant = User::factory()->create(['role' => 'etudiant']);
        $etudiant->modulesInscrits()->attach($data['module']->id);
        Sanctum::actingAs($etudiant);

        $response = $this->getJson('/api/modules/' . $data['module']->id);

        $response->assertOk()
            ->assertJsonPath('titre', 'Module Test');
    }

    public function test_student_cannot_track_visionnage_without_enrollment(): void
    {
        $data = $this->createPublishedModuleWithVideo();
        $etudiant = User::factory()->create(['role' => 'etudiant']);
        Sanctum::actingAs($etudiant);

        $response = $this->postJson('/api/videos/' . $data['video']->id . '/visionnage', [
            'position' => 30,
            'termine'  => false,
        ]);

        $response->assertForbidden();
    }

    public function test_student_can_track_visionnage_when_enrolled(): void
    {
        $data = $this->createPublishedModuleWithVideo();
        $etudiant = User::factory()->create(['role' => 'etudiant']);
        $etudiant->modulesInscrits()->attach($data['module']->id);
        Sanctum::actingAs($etudiant);

        $response = $this->postJson('/api/videos/' . $data['video']->id . '/visionnage', [
            'position' => 30,
            'termine'  => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('position', 30);
    }

    public function test_student_can_list_chapitres_when_enrolled(): void
    {
        $data = $this->createPublishedModuleWithVideo();
        $etudiant = User::factory()->create(['role' => 'etudiant']);
        $etudiant->modulesInscrits()->attach($data['module']->id);
        Sanctum::actingAs($etudiant);

        $response = $this->getJson('/api/modules/' . $data['module']->id . '/chapitres');

        $response->assertOk()
            ->assertJsonCount(1);
    }
}
