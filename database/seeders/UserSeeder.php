<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Admin EduStream',
            'email'    => 'admin@edustream.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Enseignant Test',
            'email'    => 'enseignant@edustream.com',
            'password' => Hash::make('password123'),
            'role'     => 'enseignant',
        ]);
    }
}