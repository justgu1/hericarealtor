<?php

namespace App\Http\Controllers;

use App\Models\ListingGeneralFeature;
use App\Models\ListingInternalFeature;
use App\Models\ListingExternalFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FeatureController extends Controller
{
    /**
     * Display a listing of features by type.
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'general');
        $search = $request->query('s', '');

        $model = $this->getModelByType($type);
        $query = $model::query();

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $features = $query->latest()->paginate(10);

        return Inertia::render("Admin/Listings/Features/index", [
            'features' => [
                'items' => $features->items(),
                'pagination' => [
                    'current_page' => $features->currentPage(),
                    'last_page' => $features->lastPage(),
                    'total' => $features->total(),
                    'per_page' => $features->perPage(),
                ],
            ],
            'type' => $type,
        ]);
    }

    /**
     * Show the form for creating a new feature.
     */
    public function add(Request $request)
    {
        $type = $request->query('type', 'general');
        return Inertia::render("Admin/Listings/Features/add", [
            'type' => $type,
        ]);
    }

    /**
     * Store a newly created feature in storage.
     */
    public function store(Request $request)
    {
        $type = $request->type ?? 'general';
        $model = $this->getModelByType($type);
        $table = (new $model)->getTable();

        $request->validate([
            'name' => "required|string|max:255|unique:{$table},name",
        ]);

        $model::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return redirect()->route('admin.listings.features.index', ['type' => $type])
            ->with('success', ucfirst($type) . ' feature created!');
    }

    /**
     * Show the form for editing a feature.
     */
    public function edit(Request $request, $id)
    {
        $type = $request->query('type', 'general');
        $model = $this->getModelByType($type);
        $feature = $model::findOrFail($id);

        return Inertia::render("Admin/Listings/Features/edit", [
            'feature' => $feature,
            'type' => $type,
        ]);
    }

    /**
     * Update a feature in storage.
     */
    public function update(Request $request, $id)
    {
        $type = $request->type ?? 'general';
        $model = $this->getModelByType($type);
        $table = (new $model)->getTable();
        $feature = $model::findOrFail($id);

        $request->validate([
            'name' => "required|string|max:255|unique:{$table},name,{$feature->id}",
        ]);

        $feature->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return redirect()->route('admin.listings.features.index', ['type' => $type])
            ->with('success', ucfirst($type) . ' feature updated!');
    }

    /**
     * Remove a feature from storage.
     */
    public function destroy(Request $request, $id)
    {
        $type = $request->query('type', 'general');
        $model = $this->getModelByType($type);
        $feature = $model::findOrFail($id);

        $feature->delete();

        return redirect()->route('admin.listings.features.index', ['type' => $type])
            ->with('success', ucfirst($type) . ' feature deleted!');
    }

    /**
     * Get the model class based on the feature type.
     */
    private function getModelByType($type)
    {
        return match ($type) {
            'internal' => ListingInternalFeature::class,
            'external' => ListingExternalFeature::class,
            default => ListingGeneralFeature::class,
        };
    }
}
