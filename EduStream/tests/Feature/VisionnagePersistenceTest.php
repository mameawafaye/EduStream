<?php

namespace Tests\Feature;

use App\Models\Chapitre;
use App\Models\Module;
use App\Models\User;
use App\Models\Video;
use App\Models\Visionnage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VisionnagePersistenceTest extends TestCase
{
    use RefreshDatabase;

    private function setupEnrolledStudent(): array
    {
        $enseignant = User::factory()->create(['role' => 'enseignant']);
        $etudiant = User::factory()->create(['role' => 'etudiant']);
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
            'duree'        => 100,
            'url_stockage' => 'videos/test.webm',
            'statut'       => 'disponible',
            'chapitre_id'  => $chapitre->id,
            'user_id'      => $enseignant->id,
        ]);
        $etudiant->modulesInscrits()->attach($module->id);

        return compact('etudiant', 'video', 'module');
    }

    public function test_completed_visionnage_not_reset_on_rewatch(): void
    {
        $data = $this->setupEnrolledStudent();
        Sanctum::actingAs($data['etudiant']);

        $this->postJson('/api/videos/' . $data['video']->id . '/visionnage', [
            'position' => 100,
            'termine'  => true,
        ])->assertOk()->assertJsonPath('termine', true);

        $this->postJson('/api/videos/' . $data['video']->id . '/visionnage', [
            'position' => 5,
            'termine'  => false,
        ])->assertOk()
            ->assertJsonPath('termine', true)
            ->assertJsonPath('position', 100);
    }

    public function test_position_keeps_maximum_value(): void
    {
        $data = $this->setupEnrolledStudent();
        Sanctum::actingAs($data['etudiant']);

        $this->postJson('/api/videos/' . $data['video']->id . '/visionnage', [
            'position' => 40,
            'termine'  => false,
        ])->assertOk()->assertJsonPath('position', 40);

        $this->postJson('/api/videos/' . $data['video']->id . '/visionnage', [
            'position' => 10,
            'termine'  => false,
        ])->assertOk()->assertJsonPath('position', 40);
    }

    public function test_module_progression_includes_partial_viewing(): void
    {
        $data = $this->setupEnrolledStudent();
        Sanctum::actingAs($data['etudiant']);

        Visionnage::create([
            'user_id'  => $data['etudiant']->id,
            'video_id' => $data['video']->id,
            'position' => 50,
            'termine'  => false,
        ]);

        $response = $this->getJson('/api/mes-inscriptions');

        $response->assertOk()
            ->assertJsonPath('0.progression', 50);
    }
}
