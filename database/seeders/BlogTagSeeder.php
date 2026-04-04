<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BlogTagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'PHP', 'slug' => 'php'],
            ['name' => 'Laravel', 'slug' => 'laravel'],
            ['name' => 'React', 'slug' => 'react'],
            ['name' => 'Vue.js', 'slug' => 'vue-js'],
            ['name' => 'TailwindCSS', 'slug' => 'tailwindcss'],
            ['name' => 'Docker', 'slug' => 'docker'],
            ['name' => 'DevOps', 'slug' => 'devops'],
            ['name' => 'Cybersecurity', 'slug' => 'cybersecurity'],
            ['name' => 'AI', 'slug' => 'ai'],
            ['name' => 'Cloud Computing', 'slug' => 'cloud-computing'],
        ];

        foreach ($tags as &$tag) {
            $tag['created_at'] = Carbon::now();
            $tag['updated_at'] = Carbon::now();
        }

        DB::table('blog_tags')->insert($tags);
    }
}
