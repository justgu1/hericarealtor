<?php

namespace App\Http\Controllers;

use App\Enums\CitiesEnum;
use App\Models\Listing;
use App\Models\ListingExternalFeature;
use App\Models\ListingInternalFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

use App\Enums\ListingStatusEnum;
use App\Enums\ListingTypesEnum;
use App\Enums\ListingTransactionTypeEnum;
use App\Models\Amenity;
use App\Models\ListingGallery;
use App\Models\ListingGeneralFeature;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $listings = Listing::latest('updated_at')->paginate(3);
        return Inertia::render("Admin/Listings/index", [
            'items' => $listings->items(),
            'pagination' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'total' => $listings->total(),
                'per_page' => $listings->perPage(),
            ],
        ]);
    }

    public function add()
    {
        $general_features = ListingGeneralFeature::all()->map(function ($feature) {
            return [
                'label'  => $feature->name,
                'value' => $feature->name,
            ];
        });

        $internal_features = ListingInternalFeature::all()->map(function ($feature) {
            return [
                'label'  => $feature->name,
                'value' => $feature->name,
            ];
        });

        $external_features = ListingExternalFeature::all()->map(function ($feature) {
            return [
                'label'  => $feature->name,
                'value' => $feature->name,
            ];
        });

        $amenities = Amenity::all()->map(function ($amenity) {
            return [
                'label'  => $amenity->name,
                'value' => $amenity->name,
            ];
        });
        return Inertia::render("Admin/Listings/add", [
            "statusData" => ListingStatusEnum::toArray(),
            "typesData" => ListingTypesEnum::toArray(),
            "transactionTypesData" => ListingTransactionTypeEnum::toArray(),
            "general_features" => $general_features,
            "internal_features" => $internal_features,
            "external_features" => $external_features,
            "amenities" => $amenities,
            'apiKey' => config('app.google_maps_api_key'),
            'cities' => CitiesEnum::toArray()
        ]);
    }

    public function pdf(Request $request)
    {
        try {
            $listing = $request->input('listing');

            if (!$listing || !isset($listing['address'])) {
                throw new \Exception('Listing data is missing or invalid');
            }

            $apiKey = config('app.google_maps_api_key');
            $schools   = [];
            $mapCenter = ['lat' => 0, 'lng' => 0];
            $mapBase64 = '';

            if ($apiKey) {
                $result    = $this->getNearbySchools($listing['address']);
                $schools   = $result['schools'];
                $mapCenter = $result['mapCenter'];

                if ($mapCenter['lat'] !== 0) {
                    $base    = "https://maps.googleapis.com/maps/api/staticmap?";
                    $center  = urlencode($mapCenter['lat'] . ',' . $mapCenter['lng']);
                    $markers = "markers=color:red|label:P|" . urlencode($mapCenter['lat'] . ',' . $mapCenter['lng']);
                    $schoolCount = 0;
                    foreach ($schools as $school) {
                        if ($schoolCount >= 5) break;
                        $markers .= "&markers=color:blue|label:S|" . urlencode($school['geometry']['location']['lat'] . ',' . $school['geometry']['location']['lng']);
                        $schoolCount++;
                    }
                    $mapUrl      = $base . "center=" . $center . "&zoom=14&size=600x300&" . $markers . "&key=" . $apiKey;
                    $mapResponse = Http::get($mapUrl);
                    if ($mapResponse->successful()) {
                        $mapBase64 = 'data:image/png;base64,' . base64_encode($mapResponse->body());
                    }
                }
            }

            $pdf = Pdf::loadView('pdf.listing', compact('listing', 'schools', 'mapCenter', 'mapBase64'));

            return response($pdf->output(), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="property.pdf"');
        } catch (\Exception $e) {
            Log::error('Erro ao gerar PDF: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    private function getNearbySchools($address)
    {
        $apiKey = config('app.google_maps_api_key');

        try {
            $geoResponse = Http::timeout(10)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key' => $apiKey,
            ]);

            if (!$geoResponse->successful()) {
                Log::warning('Geocode API error: ' . $geoResponse->status() . ' - ' . $geoResponse->body());
                return [
                    'schools' => [],
                    'mapCenter' => ['lat' => 0, 'lng' => 0]
                ];
            }

            $geoData = $geoResponse->json();
            if (!isset($geoData['results'][0]['geometry']['location'])) {
                Log::warning('Nenhuma localização encontrada para o endereço: ' . $address);
                return [
                    'schools' => [],
                    'mapCenter' => ['lat' => 0, 'lng' => 0]
                ];
            }

            $location = $geoData['results'][0]['geometry']['location'];
            $lat = $location['lat'];
            $lng = $location['lng'];

            $placesResponse = Http::timeout(10)->get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', [
                'location' => "{$lat},{$lng}",
                'radius' => 5000,
                'type' => 'school',
                'key' => $apiKey,
            ]);

            if (!$placesResponse->successful()) {
                Log::warning('Places API error: ' . $placesResponse->status() . ' - ' . $placesResponse->body());
                return [
                    'schools' => [],
                    'mapCenter' => ['lat' => $lat, 'lng' => $lng]
                ];
            }

            $schools = array_slice($placesResponse->json('results', []), 0, 5);

            return [
                'schools' => $schools,
                'mapCenter' => ['lat' => $lat, 'lng' => $lng]
            ];
        } catch (\Exception $e) {
            Log::error('Erro ao buscar escolas próximas: ' . $e->getMessage());
            return [
                'schools' => [],
                'mapCenter' => ['lat' => 0, 'lng' => 0]
            ];
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mls' => 'nullable|string|max:255',
            'address' => 'required|string',
            'city' => 'nullable|string',
            'description' => 'required',
            'style' => 'nullable|string|max:255',
            'data_source' => 'nullable|string|max:255',
            'sqr_footage' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'bedrooms' => 'required|integer|min:0',
            'bathrooms' => 'required|integer|min:0',
            'half_bathrooms' => 'required|integer|min:0',
            'listing_status' => 'nullable|in:0,1,2',
            'listing_type' => 'nullable|in:0,1,2,3',
            'transaction_type' => 'nullable|in:0,1,2',
            'built_date' => 'nullable|date_format:Y-m-d',
            'thumbnail' => 'nullable|image|max:2048',
            'gallery' => 'nullable|array',
            'gallery.*' => 'nullable|image|max:2048',
            'general_features' => 'nullable|array',
            'internal_features' => 'nullable|array',
            'external_features' => 'nullable|array',
            'amenities' => 'nullable|array',
        ]);
        try {
            $listing = new Listing();
            $listing->mls = $validated['mls'] ?? null;
            $listing->address = $validated['address'];
            $listing->city = $validated['city'] ?? null;
            $listing->description = $validated['description'];
            $listing->style = $validated['style'] ?? null;
            $listing->data_source = $validated['data_source'] ?? null;
            $listing->sqr_footage = $validated['sqr_footage'];
            $listing->price = $validated['price'];
            $listing->tax = $validated['tax'] ?? null;
            $listing->bedrooms = $validated['bedrooms'];
            $listing->bathrooms = $validated['bathrooms'];
            $listing->half_bathrooms = $validated['half_bathrooms'];
            $listing->status = $validated['listing_status'] ?? 0;
            $listing->type = $validated['listing_type'] ?? 0;
            $listing->transaction_type = $validated['transaction_type'] ?? 0;
            $listing->built_date = $validated['built_date'] ? Carbon::parse($validated['built_date']) : null;

            if ($request->hasFile('thumbnail')) {
                $path = $request->file('thumbnail')->store('thumbnails', 's3');
                $listing->thumbnail = $path;
            }

            $listing->save();

            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $file) {
                    $path = $file->store('gallery', 's3');
                    $listing->gallery()->create(['image_path' => $path]);
                }
            }

            $listing->priceHistories()->create([
                'price' => $listing->price,
            ]);

            $featureIds = [];
            foreach ($validated['general_features'] as $f) {
                $feature = is_array($f) ? $f['value'] : $f;
                $slug = Str::slug($feature);
                $featureRecord = ListingGeneralFeature::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $f]
                );
                $featureIds[] = $featureRecord->id;
            }
            $listing->generalFeatures()->sync($featureIds);

            $featureIds = [];
            foreach ($validated['internal_features'] as $f) {
                $feature = is_array($f) ? $f['value'] : $f;
                $slug = Str::slug($feature);
                $featureRecord = ListingInternalFeature::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $f]
                );
                $featureIds[] = $featureRecord->id;
            }
            $listing->internalFeatures()->sync($featureIds);

            $featureIds = [];
            foreach ($validated['external_features'] as $f) {
                $feature = is_array($f) ? $f['value'] : $f;
                $slug = Str::slug($feature);
                $featureRecord = ListingExternalFeature::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $f]
                );
                $featureIds[] = $featureRecord->id;
            }
            $listing->externalFeatures()->sync($featureIds);

            $amenitiesIds = [];
            foreach ($validated['amenities'] as $a) {
                $amenity = is_array($a) ? $a['value'] : $a;
                $slug = Str::slug($amenity);
                $amenityRecord = Amenity::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $a]
                );
                $amenitiesIds[] = $amenityRecord->id;
            }
            $listing->amenities()->sync($amenitiesIds);

            return redirect()->route('admin.listings.index')->with('success', 'Listing created successfully!');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to create listing: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Listing $listing)
    {
        return Inertia::render("Properties/show", [
            "listing" => $listing->load(
                'amenities',
                'internalFeatures',
                'externalFeatures',
                'generalFeatures',
                'gallery',
                'priceHistories'
            ),
            'apiKey' => config('app.google_maps_api_key'),
        ]);
    }

    public function edit(Listing $listing)
    {
        $general_features = ListingGeneralFeature::all()->map(function ($feature) {
            return [
                'label'  => $feature->name,
                'value' => $feature->name,
            ];
        });

        $internal_features = ListingInternalFeature::all()->map(function ($feature) {
            return [
                'label'  => $feature->name,
                'value' => $feature->name,
            ];
        });

        $external_features = ListingExternalFeature::all()->map(function ($feature) {
            return [
                'label'  => $feature->name,
                'value' => $feature->name,
            ];
        });

        $amenities = Amenity::all()->map(function ($amenity) {
            return [
                'label'  => $amenity->name,
                'value' => $amenity->name,
            ];
        });
        return Inertia::render("Admin/Listings/edit", [
            "listing" => $listing->load([
                "generalFeatures:id,name",
                "internalFeatures:id,name",
                "externalFeatures:id,name",
                "amenities:id,name",
            ]),
            "statusData" => ListingStatusEnum::toArray(),
            "typesData" => ListingTypesEnum::toArray(),
            "transactionTypesData" => ListingTransactionTypeEnum::toArray(),
            "gallery" => ListingGallery::where('listing_id', $listing->id)->get(),
            "general_features" => $general_features,
            "internal_features" => $internal_features,
            "external_features" => $external_features,
            "amenities" => $amenities,
            'apiKey' => config('app.google_maps_api_key'),
            'cities' => CitiesEnum::toArray()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Listing $listing)
    {
        try {
            $validated = $request->validate([
                'mls' => 'nullable|string|max:255',
                'address' => 'required|string',
                'city' => 'nullable|string|max:255',
                'description' => 'required',
                'style' => 'nullable|string|max:255',
                'data_source' => 'nullable|string|max:255',
                'sqr_footage' => 'required|numeric|min:0',
                'price' => 'required|numeric|min:0',
                'tax' => 'nullable|numeric|min:0',
                'bedrooms' => 'required|integer|min:0',
                'bathrooms' => 'required|integer|min:0',
                'half_bathrooms' => 'required|integer|min:0',
                'listing_status' => 'nullable|in:0,1,2',
                'listing_type' => 'nullable|in:0,1,2,3',
                'transaction_type' => 'nullable|in:0,1,2',
                'built_date' => 'nullable|date_format:Y-m-d',
                'thumbnail' => 'nullable|image|max:2048',
                'gallery' => 'nullable|array',
                'gallery.*' => 'nullable|image|max:2048',
                'general_features' => 'nullable|array',
                'internal_features' => 'nullable|array',
                'external_features' => 'nullable|array',
                'amenities' => 'nullable|array',
            ]);

            $listing->update([
                'mls' => $validated['mls'] ?? $listing->mls,
                'address' => $validated['address'],
                'city' => $validated['city'] ?? $listing->city,
                'description' => $validated['description'],
                'style' => $validated['style'] ?? $listing->style,
                'data_source' => $validated['data_source'] ?? $listing->data_source,
                'sqr_footage' => $validated['sqr_footage'],
                'price' => $validated['price'],
                'tax' => $validated['tax'] ?? $listing->tax,
                'bedrooms' => $validated['bedrooms'],
                'bathrooms' => $validated['bathrooms'],
                'half_bathrooms' => $validated['half_bathrooms'],
                'status' => $validated['listing_status'] ?? $listing->status,
                'type' => $validated['listing_type'] ?? $listing->type,
                'transaction_type' => $validated['transaction_type'] ?? $listing->transaction_type,
                'built_date' => $validated['built_date'] ? Carbon::parse($validated['built_date']) : $listing->built_date,
            ]);

            if ($listing->price != $validated['price']) {
                $listing->priceHistories()->create(['price' => $validated['price']]);
            }

            if ($request->hasFile('thumbnail')) {
                if ($listing->thumbnail) {
                    Storage::disk('s3')->delete($listing->thumbnail);
                }
                $path = $request->file('thumbnail')->store('thumbnails', 's3');
                $listing->thumbnail = $path;
                $listing->save();
            }

            if ($request->hasFile('gallery')) {
                foreach ($listing->gallery as $image) {
                    Storage::disk('s3')->delete($image->image_path);
                    $image->delete();
                }
                foreach ($request->file('gallery') as $file) {
                    $path = $file->store('gallery', 's3');
                    $listing->gallery()->create(['image_path' => $path]);
                }
            }

            $featureIds = [];
            foreach ($validated['general_features'] ?? [] as $f) {
                $feature = is_array($f) ? $f['value'] : $f;
                $slug = Str::slug($feature);
                $featureRecord = ListingGeneralFeature::firstOrCreate(['slug' => $slug], ['name' => $feature]);
                $featureIds[] = $featureRecord->id;
            }
            $listing->generalFeatures()->sync($featureIds);

            $featureIds = [];
            foreach ($validated['internal_features'] ?? [] as $f) {
                $feature = is_array($f) ? $f['value'] : $f;
                $slug = Str::slug($feature);
                $featureRecord = ListingInternalFeature::firstOrCreate(['slug' => $slug], ['name' => $feature]);
                $featureIds[] = $featureRecord->id;
            }
            $listing->internalFeatures()->sync($featureIds);

            $featureIds = [];
            foreach ($validated['external_features'] ?? [] as $f) {
                $feature = is_array($f) ? $f['value'] : $f;
                $slug = Str::slug($feature);
                $featureRecord = ListingExternalFeature::firstOrCreate(['slug' => $slug], ['name' => $feature]);
                $featureIds[] = $featureRecord->id;
            }
            $listing->externalFeatures()->sync($featureIds);

            $amenityIds = [];
            foreach ($validated['amenities'] ?? [] as $a) {
                $amenity = is_array($a) ? $a['value'] : $a;
                $slug = Str::slug($amenity);
                $amenityRecord = Amenity::firstOrCreate(['slug' => $slug], ['name' => $amenity]);
                $amenityIds[] = $amenityRecord->id;
            }
            $listing->amenities()->sync($amenityIds);

            return redirect()->route('admin.listings.index')->with('success', 'Listing updated successfully!');
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors(['message' => "Verify fields", "errors" => json_encode($e->errors())])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()])->withInput();
        }
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Listing $listing)
    {
        $listing->delete();
        return back();
    }

    public function properties(Request $request)
    {
        $query = Listing::with(['amenities', 'generalFeatures', 'internalFeatures', 'externalFeatures']);

        $filters = [
            'search' => $request->input('search'),
            'min_sqr_footage' => (int) $request->input('min_sqr_footage', 0),
            'max_sqr_footage' => (int) $request->input('max_sqr_footage', 100000000),
            'bedrooms' => (int) $request->input('bedrooms', 0),
            'bathrooms' => (int) $request->input('bathrooms', 0),
            'half_bathrooms' => (int) $request->input('half_bathrooms', 0),
            'min_price' => (float) preg_replace('/[^0-9.]/', '', $request->input('min_price', 0)),
            'max_price' => (float) preg_replace('/[^0-9.]/', '', $request->input('max_price', 100000000)),
            'status' => $request->input('status', []),
            'type' => $request->input('type', []),
            'transactionType' => $request->input('transactionType', []),
            'amenities' => $request->input('amenities', []),
            'general_features' => $request->input('general_features', []),
            'internal_features' => $request->input('internal_features', []),
            'external_features' => $request->input('external_features', []),
        ];

        if (!empty($filters['search'])) {
            $query->where('address', 'ILIKE', '%' . $filters['search'] . '%');
        }
        if ($filters['min_sqr_footage'] > 0) {
            $query->where('sqr_footage', '>=', $filters['min_sqr_footage']);
        }
        if ($filters['max_sqr_footage'] < 100000000) {
            $query->where('sqr_footage', '<=', $filters['max_sqr_footage']);
        }
        if ($filters['bedrooms'] > 0) {
            $query->where('bedrooms', '>=', $filters['bedrooms']);
        }
        if ($filters['bathrooms'] > 0) {
            $query->where('bathrooms', '>=', $filters['bathrooms']);
        }
        if ($filters['half_bathrooms'] > 0) {
            $query->where('half_bathrooms', '>=', $filters['half_bathrooms']);
        }
        if ($filters['min_price'] > 0) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if ($filters['max_price'] < 100000000) {
            $query->where('price', '<=', $filters['max_price']);
        }
        if (!empty($filters['status'])) {
            $statusValues = is_array($filters['status']) ? $filters['status'] : explode(',', $filters['status']);
            $query->whereIn('status', array_map('intval', $statusValues));
        }
        if (!empty($filters['type'])) {
            $typeValues = is_array($filters['type']) ? $filters['type'] : explode(',', $filters['type']);
            $query->whereIn('type', array_map('intval', $typeValues));
        }
        if (!empty($filters['transactionType'])) {
            $transactionValues = is_array($filters['transactionType']) ? $filters['transactionType'] : explode(',', $filters['transactionType']);
            $query->whereIn('transaction_type', array_map('intval', $transactionValues));
        }
        $this->applyCheckboxFilters($query, $request, [
            'amenities' => 'amenities',
            'general_features' => 'generalFeatures',
            'internal_features' => 'internalFeatures',
            'external_features' => 'externalFeatures',
        ]);

        $listings = $query
            ->orderByRaw("CASE WHEN status = 4 THEN 1 ELSE 0 END ASC")
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        $general_features = ListingGeneralFeature::all()->map(function ($feature) {
            return ['label' => $feature->name, 'value' => $feature->name];
        });

        $internal_features = ListingInternalFeature::all()->map(function ($feature) {
            return ['label' => $feature->name, 'value' => $feature->name];
        });

        $external_features = ListingExternalFeature::all()->map(function ($feature) {
            return ['label' => $feature->name, 'value' => $feature->name];
        });

        $amenities = Amenity::all()->map(function ($amenity) {
            return ['label' => $amenity->name, 'value' => $amenity->name];
        });

        return inertia('Properties/index', [
            'listings' => $listings->items(),
            'pagination' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'total' => $listings->total(),
                'per_page' => $listings->perPage(),
            ],
            'filters' => $filters,
            'statusData' => array_map(function ($status) {
                return ['value' => $status->value, 'label' => ucfirst(str_replace('_', ' ', $status->name))];
            }, ListingStatusEnum::cases()),
            'typesData' => array_map(function ($type) {
                return ['value' => $type->value, 'label' => ucfirst(str_replace('_', ' ', $type->name))];
            }, ListingTypesEnum::cases()),
            'transactionTypesData' => array_map(function ($type) {
                return ['value' => $type->value, 'label' => ucfirst(str_replace('_', ' ', $type->name))];
            }, ListingTransactionTypeEnum::cases()),
            'general_features' => $general_features,
            'internal_features' => $internal_features,
            'external_features' => $external_features,
            'amenities' => $amenities,
            'apiKey' => config('app.google_maps_api_key'),
        ]);
    }

    public function getProperties(Request $request)
    {
        $query = Listing::with(['amenities', 'generalFeatures', 'internalFeatures', 'externalFeatures']);

        $filters = [
            'search' => $request->input('search'),
            'min_sqr_footage' => (int) $request->input('min_sqr_footage', 0),
            'max_sqr_footage' => (int) $request->input('max_sqr_footage', 100000000),
            'bedrooms' => (int) $request->input('bedrooms', 0),            'bathrooms' => (int) $request->input('bathrooms', 0),
            'half_bathrooms' => (int) $request->input('half_bathrooms', 0),
            'min_price' => (float) preg_replace('/[^0-9.]/', '', $request->input('min_price', 0)),
            'max_price' => (float) preg_replace('/[^0-9.]/', '', $request->input('max_price', 100000000)),
            'status' => $request->input('status', []),
            'type' => $request->input('type', []),
            'transactionType' => $request->input('transactionType', []),
            'amenities' => $request->input('amenities', []),
            'general_features' => $request->input('general_features', []),
            'internal_features' => $request->input('internal_features', []),
            'external_features' => $request->input('external_features', []),
        ];

        if (!empty($filters['search'])) {
            $query->where('address', 'ILIKE', '%' . $filters['search'] . '%');
        }
        if ($filters['min_sqr_footage'] > 0) {
            $query->where('sqr_footage', '>=', $filters['min_sqr_footage']);
        }
        if ($filters['max_sqr_footage'] < 100000000) {
            $query->where('sqr_footage', '<=', $filters['max_sqr_footage']);
        }
        if ($filters['bedrooms'] > 0) {
            $query->where('bedrooms', '>=', $filters['bedrooms']);
        }
        if ($filters['bathrooms'] > 0) {
            $query->where('bathrooms', '>=', $filters['bathrooms']);
        }
        if ($filters['half_bathrooms'] > 0) {
            $query->where('half_bathrooms', '>=', $filters['half_bathrooms']);
        }
        if ($filters['min_price'] > 0) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if ($filters['max_price'] < 100000000) {
            $query->where('price', '<=', $filters['max_price']);
        }
        if (!empty($filters['status'])) {
            $statusValues = is_array($filters['status']) ? $filters['status'] : explode(',', $filters['status']);
            $query->whereIn('status', array_map('intval', $statusValues));
        } else {
            // By default, exclude sold (past sales) from public search
            $query->where('status', '!=', ListingStatusEnum::sold->value);
        }
        if (!empty($filters['type'])) {
            $typeValues = is_array($filters['type']) ? $filters['type'] : explode(',', $filters['type']);
            $query->whereIn('type', array_map('intval', $typeValues));
        }
        if (!empty($filters['transactionType'])) {
            $transactionValues = is_array($filters['transactionType']) ? $filters['transactionType'] : explode(',', $filters['transactionType']);
            $query->whereIn('transaction_type', array_map('intval', $transactionValues));
        }

        $this->applyCheckboxFilters($query, $request, [
            'amenities' => 'amenities',
            'general_features' => 'generalFeatures',
            'internal_features' => 'internalFeatures',
            'external_features' => 'externalFeatures',
        ]);

        $listings = $query
            ->orderByRaw("CASE WHEN status = 4 THEN 1 ELSE 0 END ASC")
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        return response()->json([
            'data' => $listings->items(),
            'pagination' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'total' => $listings->total(),
                'per_page' => $listings->perPage(),
            ],
        ]);
    }

    protected function applyCheckboxFilters($query, $request, $filters)
    {
        foreach ($filters as $inputName => $relation) {
            $selectedValues = $request->input($inputName, []);
            if (!empty($selectedValues)) {
                foreach ($selectedValues as $value) {
                    $query->whereHas($relation, function ($q) use ($value) {
                        $q->where('name', $value);
                    });
                }
            }
        }
    }
}
