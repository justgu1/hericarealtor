<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PostSeeder extends Seeder
{
    public function run()
    {
        $posts = [];

        // Buscar IDs das categorias e tags criadas
        $categoryIds = DB::table('blog_categories')->pluck('id')->toArray();
        $tagIds = DB::table('blog_tags')->pluck('id')->toArray();

        for ($i = 0; $i < 50; $i++) {
            $title = fake()->sentence();
            $content = fake()->paragraphs(3, true);
            $slug = Str::slug($title);
            $status = ['draft', 'published'][rand(0, 1)];

            $existingSlugs = DB::table('posts')->where('link', 'like', "{$slug}%")->pluck('link')->toArray();
            $count = 1;
            $newSlug = $slug;
            while (in_array($newSlug, $existingSlugs)) {
                $newSlug = "{$slug}-{$count}";
                $count++;
            }

            $postId = DB::table('posts')->insertGetId([
                'title' => $title,
                'content' => $content,
                'status' => $status,
                'timestamp' => Carbon::now(),
                'link' => $newSlug,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $randomCategories = array_rand(array_flip($categoryIds), rand(1, 3));
            $postCategories = [];
            foreach ((array) $randomCategories as $catId) {
                $postCategories[] = [
                    'post_id' => $postId,
                    'category_id' => $catId,
                ];
            }
            DB::table('post_category')->insert($postCategories);

            $randomTags = array_rand(array_flip($tagIds), rand(2, 5));
            $postTags = [];
            foreach ((array) $randomTags as $tagId) {
                $postTags[] = [
                    'post_id' => $postId,
                    'tag_id' => $tagId,
                ];
            }
            DB::table('post_tag')->insert($postTags);
        }
    }
}
