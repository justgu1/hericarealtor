<?php

namespace App\Http\Controllers;

use App\Enums\CitiesEnum;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;


class PostController extends Controller
{
    public function index()
    {
        $posts = Post::latest()->with('categories:id,name', 'tags:id,name')->paginate(10);
        return Inertia::render("Admin/Blog/Posts/index", [
            "posts" => [
                "items" => $posts->items(),
            ],
            "pagination" => [
                "current_page" => $posts->currentPage(),
                "last_page" => $posts->lastPage(),
                "total" => $posts->total(),
                "per_page" => $posts->perPage(),
            ],
        ]);
    }

    public function show(Post $post)
    {
        $completPost = $post->load(["categories:id,name", "tags:id,name"]);
        $categories = $completPost->categories;
        $tags = $completPost->tags;

        $relatedPosts = Post::latest()
            ->with('categories:id,name', 'tags:id,name')
            ->whereHas('categories', function ($query) use ($categories) {
                $query->whereIn('blog_categories.id', $categories->pluck('id'));
            })
            ->orWhereHas('tags', function ($query) use ($tags) {
                $query->whereIn('blog_tags.id', $tags->pluck('id'));
            })
            ->where('posts.id', '!=', $completPost->id)
            ->paginate(10);

        return Inertia::render("Blog/show", [
            'post' => $completPost,
            'relatedPosts' => $relatedPosts,
        ]);
    }


    public function list()
    {
        $posts = Post::latest()->with('categories:id,name', 'tags:id,name')->paginate(10);
        return Inertia::render("Blog/index", [
            "posts" => [
                "pagination" => [
                    "current_page" => $posts->currentPage(),
                    "last_page" => $posts->lastPage(),
                    "total" => $posts->total(),
                    "per_page" => $posts->perPage(),
                ],
                'items' =>  $posts->items()
            ],
        ]);
    }

    public function add()
    {
        $categories = BlogCategory::all()->map(function ($category) {
            return [
                'label'  => $category->name,
                'value' => $category->name,
            ];
        });

        $tags = BlogTag::all()->map(function ($tag) {
            return [
                'label'  => $tag->name,
                'value' => $tag->name,
            ];
        });
        return Inertia::render("Admin/Blog/Posts/add", [
            "categories" => $categories,
            "tags" => $tags,
            "cities" => CitiesEnum::toarray()
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required',
                'categories' => 'array|min:1',
                'tags' => 'nullable|array',
                'thumbnail' => 'nullable|image|max:2048',
            ]);

            $categoryIds = [];
            foreach ($validated['categories'] as $cat) {
                $category = is_array($cat) ? $cat['value'] : $cat;
                $slug = Str::slug($category);
                $categoryRecord = BlogCategory::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $category]
                );
                $categoryIds[] = $categoryRecord->id;
            }

            // Gerando um link único baseado no título
            $slug = Str::slug($validated['title']);
            $existingSlugs = Post::where('link', 'like', "{$slug}%")->pluck('link')->toArray();
            $count = 1;
            $newSlug = $slug;

            while (in_array($newSlug, $existingSlugs)) {
                $newSlug = "{$slug}-{$count}";
                $count++;
            }

            $post = new Post();
            $post->title = $validated['title'];
            $post->content = $validated['content'];
            $post->link = $newSlug;
            $post->save();

            $post->categories()->sync($categoryIds);

            if ($request->hasFile('thumbnail')) {
                $path = $request->file('thumbnail')->store('thumbnails', 's3');
                $post->thumbnail = $path;
                $post->save();
            }

            $tagIds = [];
            if (isset($validated['tags'])) {
                foreach ($validated['tags'] as $t) {
                    $tag = is_array($t) ? $t['value'] : $t;
                    $slug = Str::slug($tag);
                    $tagRecord = BlogTag::firstOrCreate(
                        ['slug' => $slug],
                        ['name' => $tag]
                    );
                    $tagIds[] = $tagRecord->id;
                }
            }

            $post->tags()->sync($tagIds);

            return redirect()->route('admin.blog.posts.index')
                ->with('success', 'Success on create post!');
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()])->withInput();
        }
    }

    public function edit(Post $post)
    {
        $categories = BlogCategory::all()->map(function ($category) {
            return [
                'label'  => $category->name,
                'value' => $category->name,
            ];
        });

        $tags = BlogTag::all()->map(function ($tag) {
            return [
                'label'  => $tag->name,
                'value' => $tag->name,
            ];
        });
        return Inertia::render("Admin/Blog/Posts/edit", [
            "post" => $post->load(["categories:id,name", "tags:id,name"])->toArray(),
            "categories" => $categories,
            "tags" => $tags,
        ]);
    }

    public function update(Request $request, Post $post)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required',
                'categories' => 'array|min:1',
                'tags' => 'nullable|array',
                'thumbnail' => 'nullable|image|max:2048',
            ]);
            $post->update([
                'title' => $validated['title'],
                'content' => $validated['content'],
            ]);

            $categoryIds = [];
            foreach ($validated['categories'] as $cat) {
                $category = is_array($cat) ? $cat['value'] : $cat;
                $slug = Str::slug($category);
                $categoryRecord = BlogCategory::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $category]
                );
                $categoryIds[] = $categoryRecord->id;
            }

            $post->categories()->sync($categoryIds);

            $tagIds = [];

            if (isset($validated['tags'])) {
                foreach ($validated['tags'] as $t) {
                    $tag = is_array($t) ? $t['value'] : $t;
                    $slug = Str::slug($tag);
                    $tagRecord = BlogTag::firstOrCreate(
                        ['slug' => $slug],
                        ['name' => $tag]
                    );
                    $tagIds[] = $tagRecord->id;
                }
            }

            $post->tags()->sync($tagIds);

            if ($request->hasFile('thumbnail')) {
                $path = $request->file('thumbnail')->store('thumbnails', 's3');
                $post->thumbnail = $path;
                $post->save();
            }

            return redirect()->route('admin.blog.posts.index')->with('success', 'Success on update post!');
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors(['message' => "verify fields", "errors" => $e->errors()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()])->withInput();
        }
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return redirect()->route("admin.blog.posts.index")->with("success", "successfully post delet!");
    }
}
