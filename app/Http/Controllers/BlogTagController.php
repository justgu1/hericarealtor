<?php

namespace App\Http\Controllers;

use App\Models\BlogTag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BlogTagController extends Controller
{
    public function index()
    {
        $tags = BlogTag::latest()->paginate(10);
        return Inertia::render("Admin/Blog/Tags/index", [
            "tags" => [
                "items" => $tags->items(),
                "pagination" => [
                    "current_page" => $tags->currentPage(),
                    "last_page" => $tags->lastPage(),
                    "total" => $tags->total(),
                    "per_page" => $tags->perPage(),
                ],
            ],
        ]);
    }

    public function add()
    {
        return Inertia::render("Admin/Blog/Tags/add");
    }

    public function store(Request $request)
    {
        $request->validate([
            "name" => "required|string|max:255|unique:blog_tags,name",
        ]);

        BlogTag::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return redirect()->route("admin.blog.tags.index")->with("success", "tag created!");
    }

    public function edit(BlogTag $tag)
    {
        return Inertia::render("Admin/Blog/Tags/edit", [
            "tag" => $tag,
        ]);
    }

    public function update(Request $request, BlogTag $tag)
    {
        $request->validate([
            "name" => "required|string|max:255|unique:blog_tags,name," . $tag->id,
        ]);

        $tag->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return redirect()->route("admin.blog.tags.index")->with("success", "tag updated!");
    }

    public function destroy(BlogTag $tag)
    {
        $tag->delete();
        return redirect()->route('admin.blog.tags.index')
            ->with('success', 'Success on delete tag!');
    }
}
