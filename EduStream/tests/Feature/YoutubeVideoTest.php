<?php

namespace Tests\Feature;

use App\Models\Chapitre;
use App\Models\Module;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class YoutubeVideoTest extends TestCase
{
    use RefreshDatabase;

    private function setupModule(): array
    {
        $enseignant = User::factory()->create(['role' => 'enseignant']);
        $module = Module::create([
            'titre'   => 'Module Test',
            'statut'  => 'brouillon',
            'user_id' => $enseignant->id,
        ]);
        $chapitre = Chapitre::create([
            'titre'     => 'Chapitre 1',
            'ordre'     => 1,
            'module_id' => $module->id,
        ]);

        return compact('enseignant', 'module', 'chapitre');
    }

    public function test_enseignant_can_add_youtube_video(): void
    {
        $data = $this->setupModule();
        Sanctum::actingAs($data['enseignant']);

        $response = $this->postJson(
            "/api/modules/{$data['module']->id}/chapitres/{$data['chapitre']->id}/videos",
            [
                'source_type' => 'youtube',
                'titre'       => 'Cours YouTube',
                'description' => 'Introduction',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duree'       => 212,
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('source_type', 'youtube')
            ->assertJsonPath('youtube_id', 'dQw4w9WgXcQ')
            ->assertJsonPath('titre', 'Cours YouTube');

        $this->assertDatabaseHas('videos', [
            'source_type' => 'youtube',
            'youtube_id'  => 'dQw4w9WgXcQ',
        ]);
    }

    public function test_rejects_when_no_youtube_and_no_file(): void
    {
        $data = $this->setupModule();
        Sanctum::actingAs($data['enseignant']);

        $response = $this->postJson(
            "/api/modules/{$data['module']->id}/chapitres/{$data['chapitre']->id}/videos",
            ['titre' => 'Sans source']
        );

        $response->assertStatus(422);
    }

    public function test_rejects_invalid_youtube_url(): void
    {
        $data = $this->setupModule();
        Sanctum::actingAs($data['enseignant']);

        $response = $this->postJson(
            "/api/modules/{$data['module']->id}/chapitres/{$data['chapitre']->id}/videos",
            [
                'source_type' => 'youtube',
                'titre'       => 'Cours',
                'youtube_url' => 'https://example.com/not-youtube',
            ]
        );

        $response->assertStatus(422);
    }

    public function test_enseignant_can_update_youtube_video(): void
    {
        $data = $this->setupModule();
        Sanctum::actingAs($data['enseignant']);

        $video = Video::create([
            'titre'        => 'Ancien titre',
            'source_type'  => 'youtube',
            'youtube_id'   => 'dQw4w9WgXcQ',
            'url_stockage' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'statut'       => 'disponible',
            'chapitre_id'  => $data['chapitre']->id,
            'user_id'      => $data['enseignant']->id,
        ]);

        $response = $this->putJson(
            "/api/modules/{$data['module']->id}/chapitres/{$data['chapitre']->id}/videos/{$video->id}",
            [
                'titre'       => 'Nouveau titre',
                'youtube_url' => 'https://youtu.be/9bZkp7q19f0',
            ]
        );

        $response->assertOk()
            ->assertJsonPath('titre', 'Nouveau titre')
            ->assertJsonPath('youtube_id', '9bZkp7q19f0');
    }

    public function test_delete_youtube_video_does_not_touch_storage(): void
    {
        $data = $this->setupModule();
        Sanctum::actingAs($data['enseignant']);

        $video = Video::create([
            'titre'        => 'YT',
            'source_type'  => 'youtube',
            'youtube_id'   => 'dQw4w9WgXcQ',
            'url_stockage' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'statut'       => 'disponible',
            'chapitre_id'  => $data['chapitre']->id,
            'user_id'      => $data['enseignant']->id,
        ]);

        $this->deleteJson(
            "/api/modules/{$data['module']->id}/chapitres/{$data['chapitre']->id}/videos/{$video->id}"
        )->assertOk();

        $this->assertDatabaseMissing('videos', ['id' => $video->id]);
    }
}
