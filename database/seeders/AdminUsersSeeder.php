<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Guilherme Santos',   'email' => 'szguisantos@gmail.com'],
            ['name' => 'Gustavo Almeida',    'email' => 'gustavo.almeida@bluevulcan.com.br'],
            ['name' => 'Hiago Rissato',      'email' => 'hiago.rissato@bluevulcan.com.br'],
            ['name' => 'Herica De Oliveira', 'email' => 'hericarealtor@gmail.com'],
        ];

        foreach ($users as $userData) {
            $plainPassword = Str::random(12);

            User::create([
                'name'     => $userData['name'],
                'email'    => $userData['email'],
                'password' => Hash::make($plainPassword),
            ]);

            $this->command->line(
                "  <info>{$userData['email']}</info> → temporary password: <comment>{$plainPassword}</comment>"
            );
        }
    }
}
