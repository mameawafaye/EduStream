<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_always_creates_etudiant_even_if_role_sent(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@edustream.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'role'                  => 'enseignant',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'email' => 'test@edustream.com',
            'role'  => 'etudiant',
        ]);
    }

    public function test_forgot_password_returns_generic_message(): void
    {
        User::factory()->create(['email' => 'user@edustream.com']);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'user@edustream.com',
        ]);

        $response->assertOk()
            ->assertJsonFragment([
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
            ]);
    }

    public function test_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'user@edustream.com']);
        $token = 'plain-reset-token';

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email'                 => $user->email,
            'token'                 => $token,
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Mot de passe réinitialisé avec succès.']);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    public function test_reset_password_rejects_invalid_token(): void
    {
        User::factory()->create(['email' => 'user@edustream.com']);

        $response = $this->postJson('/api/reset-password', [
            'email'                 => 'user@edustream.com',
            'token'                 => 'invalid-token',
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422);
    }
}
