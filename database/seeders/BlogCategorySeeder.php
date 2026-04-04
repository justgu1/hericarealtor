<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BlogCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'No Category', 'slug' => 'no-category'],
            ['name' => 'Technology', 'slug' => 'technology'],
            ['name' => 'Business', 'slug' => 'business'],
            ['name' => 'Health', 'slug' => 'health'],
            ['name' => 'Education', 'slug' => 'education'],
            ['name' => 'Lifestyle', 'slug' => 'lifestyle'],
            ['name' => 'Entertainment', 'slug' => 'entertainment'],
            ['name' => 'Sports', 'slug' => 'sports'],
            ['name' => 'Science', 'slug' => 'science'],
            ['name' => 'Travel', 'slug' => 'travel'],
        ];

        foreach ($categories as &$category) {
            $category['created_at'] = Carbon::now();
            $category['updated_at'] = Carbon::now();
        }

        DB::table('blog_categories')->insert($categories);
    }
}
