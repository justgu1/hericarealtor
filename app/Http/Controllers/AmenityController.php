<?php

namespace App\Http\Controllers;

use App\Models\Amenity;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AmenityController extends Controller
{
    public function index()
    {
        $amenities = Amenity::latest()->paginate(10);
        return Inertia::render("Admin/Listings/Amenities/index", [
            "amenities" => [
                "items" => $amenities->items(),
                "pagination" => [
                    "current_page" => $amenities->currentPage(),
                    "last_page" => $amenities->lastPage(),
                    "total" => $amenities->total(),
                    "per_page" => $amenities->perPage(),
                ],
            ],
        ]);
    }

    public function add()
    {
        return Inertia::render("Admin/Listings/Amenities/add");
    }

    public function store(Request $request)
    {
        $request->validate([
            "name" => "required|string|max:255|unique:listing_amenities,name",
        ]);

        Amenity::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return redirect()->route("admin.listings.amenities.index")->with("success", "amenity created!");
    }

    public function edit(Amenity $amenity)
    {
        return Inertia::render("Admin/Listings/Amenities/edit", [
            "amenity" => $amenity,
        ]);
    }

    public function update(Request $request, Amenity $amenity)
    {
        $request->validate([
            "name" => "required|string|max:255|unique:listing_amenities,name," . $amenity->id,
        ]);

        $amenity->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return redirect()->route("admin.listings.amenities.index")->with("success", "amenity updated!");
    }

    public function destroy(Amenity $amenity)
    {
        $amenity->delete();
        return redirect()->route('admin.listings.amenities.index')
            ->with('success', 'Success on delete amenity!');
    }
}