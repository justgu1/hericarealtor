<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::latest()->paginate(10);
        return Inertia::render("Admin/Reviews/index", [
            "reviews" => [
                "items" => $reviews->items(),
                "pagination" => [
                    "current_page" => $reviews->currentPage(),
                    "last_page" => $reviews->lastPage(),
                    "total" => $reviews->total(),
                    "per_page" => $reviews->perPage(),
                ],
            ],
        ]);
    }

    public function add()
    {
        return Inertia::render("Admin/Reviews/add");
    }

    public function store(Request $request)
    {
        $request->validate([
            "title" => "required|string|max:255|",
            "content" => "required|string",
            "author" => "required|string|max:255|",
        ]);
        Review::create([
            "title" => $request->title,
            "content" => $request->content,
            "author" => $request->author
        ]);

        return redirect()->route("admin.reviews.index")->with("success", "review created!");
    }

    public function edit(Review $review)
    {
        return Inertia::render("Admin/Reviews/edit", [
            "review" => $review,
        ]);
    }

    public function update(Request $request, Review $review)
    {
        $request->validate([
            "title" => "required|string|max:255|",
            "content" => "required|string",
            "author" => "required|string|max:255|",
        ]);

        $review->update([
            "title" => $request->title,
            "content" => $request->content,
            "author" => $request->author
        ]);

        return redirect()->route("admin.reviews.index")->with("success", "review updated!");
    }

    public function destroy(Review $review)
    {
        $review->delete();
        return redirect()->route('admin.reviews.index')
            ->with('success', 'Success on delete review!');
    }
}
