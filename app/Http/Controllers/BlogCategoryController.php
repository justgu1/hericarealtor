<?php

namespace App\Http\Controllers;

use App\Models\BlogCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BlogCategoryController extends Controller
{
    public function index()
    {
        $categories = BlogCategory::latest()->paginate(10);
        return Inertia::render("Admin/Blog/Categories/index", [
            "categories" => [
                "items" => $categories->items(),
                "pagination" => [
                    "current_page" => $categories->currentPage(),
                    "last_page" => $categories->lastPage(),
                    "total" => $categories->total(),
                    "per_page" => $categories->perPage(),
                ],
            ],
        ]);
    }

    public function add()
    {
        return Inertia::render("Admin/Blog/Categories/add");
    }

    public function store(Request $request)
    {
        $request->validate([
            "name" => "required|string|max:255|unique:blog_categories,name",
        ]);

        BlogCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return redirect()->route("admin.blog.categories.index")->with("success", "Category created!");
    }

    public function edit(BlogCategory $category)
    {
        return Inertia::render("Admin/Blog/Categories/edit", [
            "category" => $category,
        ]);
    }

    public function update(Request $request, BlogCategory $category)
    {
        $request->validate([
            "name" => "required|string|max:255|unique:blog_categories,name," . $category->id,
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return redirect()->route("admin.blog.categories.index")->with("success", "Category updated!");
    }

    public function destroy(BlogCategory $category)
    {
        $category->delete();
        return redirect()->route('admin.blog.categories.index')
            ->with('success', 'Success on delete category!');
    }
}
