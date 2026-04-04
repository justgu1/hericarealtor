<?php

namespace App\Console\Commands;

use App\Enums\ListingStatusEnum;
use App\Enums\ListingTransactionTypeEnum;
use App\Enums\ListingTypesEnum;
use App\Models\Amenity;
use App\Models\Listing;
use App\Models\ListingExternalFeature;
use App\Models\ListingGallery;
use App\Models\ListingGeneralFeature;
use App\Models\ListingInternalFeature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImportListings extends Command
{
    protected $signature = 'listings:import {--limit=100} {--force : Re-process listings that already exist}';

    protected $description = 'Import new Zillow listings from zillow_listings into the app listings table';

    // ── Keyword → slug maps ───────────────────────────────────────────────────

    private array $internalKeywords = [
        'air conditioning'          => 'air-conditioning',
        'central air'               => 'air-conditioning',
        'central heating'           => 'central-heating',
        'fireplace'                 => 'fireplace',
        'hardwood floor'            => 'hardwood-floors',
        'wood floor'                => 'hardwood-floors',
        'walk-in closet'            => 'walk-in-closet',
        'walk in closet'            => 'walk-in-closet',
        'high ceiling'              => 'high-ceilings',
        'vaulted ceiling'           => 'high-ceilings',
        'smart thermostat'          => 'smart-thermostat',
        'home theater'              => 'home-theater',
        'wine cellar'               => 'wine-cellar',
        'laundry room'              => 'laundry-room',
        'washer'                    => 'laundry-room',
        'built-in shelv'            => 'built-in-shelves',
        'built in shelv'            => 'built-in-shelves',
        'energy efficient window'   => 'energy-efficient-windows',
        'open floor plan'           => 'open-floor-plan',
        'open concept'              => 'open-floor-plan',
        'granite countertop'        => 'granite-countertops',
        'granite counter'           => 'granite-countertops',
        'stainless steel appliance' => 'stainless-steel-appliances',
        'stainless steel'           => 'stainless-steel-appliances',
        'jacuzzi tub'               => 'jacuzzi-tub',
        'soaking tub'               => 'jacuzzi-tub',
        'skylight'                  => 'skylights',
        'solar panel'               => 'solar-panels',
        'home office'               => 'home-office',
        'office space'              => 'home-office',
    ];

    private array $externalKeywords = [
        'swimming pool'     => 'swimming-pool',
        'private pool'      => 'swimming-pool',
        'pool'              => 'swimming-pool',
        'patio'             => 'patio',
        'covered patio'     => 'patio',
        'deck'              => 'deck',
        'wood deck'         => 'deck',
        'outdoor kitchen'   => 'outdoor-kitchen',
        'summer kitchen'    => 'outdoor-kitchen',
        'fire pit'          => 'fire-pit',
        'landscaped'        => 'landscaped-garden',
        'fenced yard'       => 'fenced-yard',
        'fenced'            => 'fenced-yard',
        'gazebo'            => 'gazebo',
        'outdoor lighting'  => 'outdoor-lighting',
        'sprinkler'         => 'sprinkler-system',
        'hot tub'           => 'hot-tub',
        'tennis court'      => 'tennis-court',
        'basketball court'  => 'basketball-court',
        'playground'        => 'playground',
        'greenhouse'        => 'greenhouse',
        'pond'              => 'pond',
        'dog run'           => 'dog-run',
        'outdoor shower'    => 'outdoor-shower',
    ];

    private array $amenityKeywords = [
        'gym'             => 'gym',
        'fitness center'  => 'gym',
        'fitness room'    => 'gym',
        'elevator'        => 'elevator',
        'concierge'       => 'concierge',
        'pet friendly'    => 'pet-friendly',
        'pets allowed'    => 'pet-friendly',
        'clubhouse'       => 'clubhouse',
        'sauna'           => 'sauna',
        'jacuzzi'         => 'jacuzzi',
        'bbq area'        => 'bbq-area',
        'barbecue'        => 'bbq-area',
        'bike storage'    => 'bike-storage',
        'roof terrace'    => 'roof-terrace',
        'smart home'      => 'smart-home',
        'security'        => 'security',
        'gated access'    => 'security',
        'green area'      => 'green-areas',
        'parking'         => 'parking',
        'garage'          => 'parking',
        'playground'      => 'playground',
    ];

    private array $generalKeywords = [
        'waterfront'        => 'waterfront',
        'water front'       => 'waterfront',
        'intracoastal'      => 'waterfront',
        'oceanfront'        => 'waterfront',
        'ocean view'        => 'ocean-view',
        'ocean front'       => 'ocean-view',
        'water view'        => 'waterfront',
        'mountain view'     => 'mountain-view',
        'city view'         => 'city-view',
        'skyline view'      => 'city-view',
        'gated community'   => 'gated-community',
        'gated'             => 'gated-community',
        'pet friendly'      => 'pet-friendly',
        'pets allowed'      => 'pet-friendly',
        'energy efficient'  => 'energy-efficient',
        'eco-friendly'      => 'eco-friendly',
        'new construction'  => 'new-construction',
        'newly built'       => 'new-construction',
        'renovated'         => 'renovated',
        'remodeled'         => 'renovated',
        'fully updated'     => 'renovated',
        'newly updated'     => 'renovated',
        'furnished'         => 'furnished',
        'turnkey'           => 'furnished',
        'vacation rental'   => 'vacation-rental',
        'airbnb'            => 'vacation-rental',
        'investment'        => 'investment-property',
        'income producing'  => 'investment-property',
        'wheelchair'        => 'wheelchair-accessible',
        'accessible'        => 'wheelchair-accessible',
        'historic'          => 'historic-property',
        'smart home'        => 'smart-home',
        'security system'   => 'security-system',
    ];

    // ── Zillow value maps ──────────────────────────────────────────────────────

    private array $homeTypeMap = [
        'SINGLE_FAMILY' => ListingTypesEnum::single_family,
        'CONDO'         => ListingTypesEnum::condos,
        'CONDOP'        => ListingTypesEnum::condos,
        'APARTMENT'     => ListingTypesEnum::condos,
        'COMMERCIAL'    => ListingTypesEnum::commercial,
        'LAND'          => ListingTypesEnum::land,
        'LOT'           => ListingTypesEnum::land,
        'TOWNHOUSE'     => ListingTypesEnum::townhouse,
        'MULTI_FAMILY'  => ListingTypesEnum::multi_family,
        'MOBILE'        => ListingTypesEnum::mobile_home,
        'MANUFACTURED'  => ListingTypesEnum::manufactured,
        'VILLA'         => ListingTypesEnum::villa,
    ];

    private array $statusMap = [
        'FOR_SALE'    => ListingStatusEnum::active,
        'ACTIVE'      => ListingStatusEnum::active,
        'COMING_SOON' => ListingStatusEnum::coming_soon,
        'CONTINGENT'  => ListingStatusEnum::contingent,
        'PENDING'     => ListingStatusEnum::pending,
        'SOLD'        => ListingStatusEnum::active,
    ];

    private array $transactionMap = [
        'for_sale' => ListingTransactionTypeEnum::buy,
        'sold'     => ListingTransactionTypeEnum::buy,
        'for_rent' => ListingTransactionTypeEnum::rent,
    ];

    // ── Command entry point ────────────────────────────────────────────────────

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $force = $this->option('force');

        $existingMls = $force ? [] : DB::table('listings')
            ->whereNotNull('mls')
            ->pluck('mls')
            ->toArray();

        $query = DB::table('zillow_listings');
        if (!$force && count($existingMls) > 0) {
            $query->whereNotIn('zpid', $existingMls);
        }

        $rows = $query->orderBy('updated_at', 'desc')->limit($limit)->get();

        $this->info("Found {$rows->count()} listings to import (limit={$limit})");

        $imported = $updated = $skipped = 0;

        foreach ($rows as $row) {
            $data = is_string($row->data) ? json_decode($row->data, true) : (array)$row->data;
            $data['category'] = $row->category;

            $result = $this->importListing($row->zpid, $data);
            match ($result) {
                'imported' => $imported++,
                'updated'  => $updated++,
                default    => $skipped++,
            };
        }

        $this->info("Done — imported={$imported} updated={$updated} skipped={$skipped}");
        return self::SUCCESS;
    }

    // ── Core import logic ──────────────────────────────────────────────────────

    private function importListing(string $zpid, array $data): string
    {
        try {
            $price = $this->parseNumber($data['price'] ?? 0);
            if ($price <= 0) {
                $this->warn("Skipping zpid={$zpid}: no valid price");
                return 'skipped';
            }

            // Address — handle both flat string and nested object (for_rent format)
            $addressRaw = $data['address'] ?? null;
            if (is_array($addressRaw)) {
                $street  = $addressRaw['line1'] ?? '';
                $cityRaw = $addressRaw['city'] ?? '';
                $state   = $addressRaw['stateOrProvince'] ?? '';
            } else {
                $street   = $data['street_address'] ?? (is_string($addressRaw) ? $addressRaw : '');
                $cityRaw  = $data['city'] ?? '';
                $state    = $data['state'] ?? '';
            }
            if (!$cityRaw) {
                $csz     = $data['city_state_zipcode'] ?? '';
                $parts   = explode(',', $csz);
                $cityRaw = trim($parts[0] ?? '');
            }
            $address = implode(', ', array_filter([$street, $cityRaw, $state])) ?: 'Unknown';

            $homeTypeRaw = strtoupper($data['homeType'] ?? $data['home_type'] ?? '');
            $category    = $data['category'] ?? 'for_sale';

            $listingType    = $this->homeTypeMap[$homeTypeRaw] ?? ListingTypesEnum::single_family;
            $transType      = $this->transactionMap[$category] ?? ListingTransactionTypeEnum::buy;
            $statusRaw      = strtoupper($data['statusType'] ?? $data['status'] ?? 'ACTIVE');
            $status         = $this->statusMap[$statusRaw] ?? ListingStatusEnum::active;
            // Sold listings (past sales) are never available — override regardless of statusType
            if ($category === 'sold') {
                $status = ListingStatusEnum::sold;
            }

            // Prefer richer data from detail page (resoFacts) when available
            $reso       = is_array($data['resoFacts'] ?? null) ? $data['resoFacts'] : [];
            $yearBuilt  = $data['yearBuilt'] ?? $reso['yearBuilt'] ?? null;
            $builtDate  = $yearBuilt ? "{$yearBuilt}-01-01" : null;

            $description = $data['description'] ?? '';
            $sqrFootage  = $this->parseNumber(
                $data['livingAreaValue'] ?? $data['livingArea'] ?? $reso['livingArea'] ?? 0
            );
            $bedrooms    = (int) $this->parseNumber($data['bedrooms'] ?? $reso['bedrooms'] ?? 0);
            $bathrooms   = (int) $this->parseNumber($data['bathrooms'] ?? $reso['bathrooms'] ?? 0);

            if (!$description) {
                $description = $this->generateDescription([
                    'address'    => $address,
                    'homeType'   => $homeTypeRaw,
                    'bedrooms'   => $bedrooms,
                    'bathrooms'  => $bathrooms,
                    'sqrFootage' => $sqrFootage,
                    'yearBuilt'  => $yearBuilt,
                    'city'       => $cityRaw,
                    'category'   => $category,
                    'reso'       => $reso,
                ]);
            }

            // Photos from detail scrape (photos[]) or fallback to profile-API thumbnail
            $photos    = $data['photos'] ?? [];
            $thumbnail = $this->downloadImage($zpid, $data, $photos);

            $isNew = !DB::table('listings')->where('mls', $zpid)->exists();

            $listing = Listing::updateOrCreate(
                ['mls' => $zpid],
                [
                    'address'          => $address,
                    'city'             => $this->normalizeCity($cityRaw),
                    'description'      => $description,
                    'style'            => $data['homeType'] ?? $data['home_type'] ?? '',
                    'data_source'      => 'zillow',
                    'sqr_footage'      => $sqrFootage,
                    'price'            => $price,
                    'bedrooms'         => $bedrooms,
                    'bathrooms'        => $bathrooms,
                    'half_bathrooms'   => 0,
                    'status'           => $status->value,
                    'type'             => $listingType->value,
                    'transaction_type' => $transType->value,
                    'built_date'       => $builtDate,
                    'thumbnail'        => $thumbnail,
                ]
            );

            // Gallery — upload all detail-page photos to MinIO
            if (!empty($photos)) {
                $this->syncGallery($listing, $zpid, $photos);
            }

            // Features — keyword-match description AND structured resoFacts
            $this->attachFeatures($listing, $description, $reso);

            return $isNew ? 'imported' : 'updated';
        } catch (\Throwable $e) {
            Log::error("ImportListings: failed zpid={$zpid}: {$e->getMessage()}");
            $this->error("  ✗ zpid={$zpid}: {$e->getMessage()}");
            return 'skipped';
        }
    }

    // ── Image download ─────────────────────────────────────────────────────────

    private function downloadImage(string $zpid, array $data, array $photos = []): ?string
    {
        $s3Path = "listings/{$zpid}.jpg";
        if (Storage::disk('s3')->exists($s3Path)) {
            return $s3Path;
        }

        // Prefer first detail-page photo, fallback to profile-API thumbnail
        $imageUrl = $photos[0]
            ?? $data['medium_image_url']
            ?? $data['image_url']
            ?? $data['primary_photo_url']
            ?? $data['imgSrc']
            ?? null;

        if (!$imageUrl) {
            return null;
        }

        try {
            $response = Http::timeout(15)->get($imageUrl);
            if ($response->successful()) {
                Storage::disk('s3')->put($s3Path, $response->body());
                return $s3Path;
            }
        } catch (\Throwable $e) {
            Log::warning("ImportListings: image download failed zpid={$zpid}: {$e->getMessage()}");
        }

        return $imageUrl;
    }

    private function syncGallery(Listing $listing, string $zpid, array $photos): void
    {
        $existing = $listing->gallery()->pluck('image_path')->toArray();
        $position = count($existing);

        foreach (array_slice($photos, 0, 30) as $i => $photoUrl) {
            $s3Path = "listings/{$zpid}-{$i}.jpg";

            // Skip if already stored
            if (in_array($s3Path, $existing) || in_array($photoUrl, $existing)) {
                continue;
            }

            $storedPath = $photoUrl;

            if (!Storage::disk('s3')->exists($s3Path)) {
                try {
                    $resp = Http::timeout(15)->get($photoUrl);
                    if ($resp->successful()) {
                        Storage::disk('s3')->put($s3Path, $resp->body());
                        $storedPath = $s3Path;
                    }
                } catch (\Throwable $e) {
                    Log::warning("Gallery download failed zpid={$zpid} i={$i}: {$e->getMessage()}");
                }
            } else {
                $storedPath = $s3Path;
            }

            $listing->gallery()->create([
                'image_path' => $storedPath,
                'position'   => $position++,
            ]);
        }
    }

    // ── Feature inference ──────────────────────────────────────────────────────

    private function attachFeatures(Listing $listing, string $description, array $reso = []): void
    {
        $desc = strtolower($description);

        $internalSlugs = $this->matchKeywords($desc, $this->internalKeywords);
        $externalSlugs = $this->matchKeywords($desc, $this->externalKeywords);
        $amenitySlugs  = $this->matchKeywords($desc, $this->amenityKeywords);
        $generalSlugs  = $this->matchKeywords($desc, $this->generalKeywords);

        // Structured data from resoFacts — much more reliable than keyword matching
        if (!empty($reso)) {
            $this->inferFromResoFacts($reso, $internalSlugs, $externalSlugs, $amenitySlugs, $generalSlugs);
        }

        if ($internalSlugs) {
            $ids = ListingInternalFeature::whereIn('slug', array_unique($internalSlugs))->pluck('id');
            $listing->internalFeatures()->syncWithoutDetaching($ids);
        }
        if ($externalSlugs) {
            $ids = ListingExternalFeature::whereIn('slug', array_unique($externalSlugs))->pluck('id');
            $listing->externalFeatures()->syncWithoutDetaching($ids);
        }
        if ($amenitySlugs) {
            $ids = Amenity::whereIn('slug', array_unique($amenitySlugs))->pluck('id');
            $listing->amenities()->syncWithoutDetaching($ids);
        }
        if ($generalSlugs) {
            $ids = ListingGeneralFeature::whereIn('slug', array_unique($generalSlugs))->pluck('id');
            $listing->generalFeatures()->syncWithoutDetaching($ids);
        }
    }

    private function inferFromResoFacts(array $reso, array &$internal, array &$external, array &$amenity, array &$general): void
    {
        $add = function (array &$arr, string $slug) {
            if (!in_array($slug, $arr)) $arr[] = $slug;
        };

        // Cooling
        foreach ((array)($reso['cooling'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'central') || str_contains($v, 'air')) $add($internal, 'air-conditioning');
        }
        // Also infer A/C from cooling boolean
        if (!empty($reso['hasCooling'])) $add($internal, 'air-conditioning');

        // Heating
        foreach ((array)($reso['heating'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'central')) $add($internal, 'central-heating');
        }
        if (!empty($reso['hasHeating'])) $add($internal, 'central-heating');

        // Pool
        if (!empty($reso['hasPool']) || !empty($reso['poolFeatures'])) {
            $add($external, 'swimming-pool');
        }

        // Garage/Parking
        if (!empty($reso['hasGarage']) || !empty($reso['garageParkingCapacity'])) {
            $add($amenity, 'parking');
        }
        if (!empty($reso['hasCarport']) || !empty($reso['carportParkingCapacity'])) {
            $add($amenity, 'parking');
        }
        foreach ((array)($reso['parkingFeatures'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'garage') || str_contains($v, 'driveway') || str_contains($v, 'assigned') || str_contains($v, 'covered')) {
                $add($amenity, 'parking');
            }
        }

        // Fireplace
        if (!empty($reso['hasFireplace']) || !empty($reso['fireplaceFeatures'])) {
            $add($internal, 'fireplace');
        }

        // Laundry
        foreach ((array)($reso['laundryFeatures'] ?? []) as $v) {
            if (str_contains(strtolower($v), 'unit') || str_contains(strtolower($v), 'in')) {
                $add($internal, 'laundry-room');
            }
        }

        // Flooring
        foreach ((array)($reso['flooring'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'hardwood') || str_contains($v, 'wood')) $add($internal, 'hardwood-floors');
        }

        // Appliances
        foreach ((array)($reso['appliances'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'dishwasher')) $add($internal, 'stainless-steel-appliances');
        }

        // Interior features
        foreach ((array)($reso['interiorFeatures'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'walk-in closet') || str_contains($v, 'walk in closet')) $add($internal, 'walk-in-closet');
            if (str_contains($v, 'high ceiling') || str_contains($v, 'vaulted')) $add($internal, 'high-ceilings');
            if (str_contains($v, 'open floor')) $add($internal, 'open-floor-plan');
            if (str_contains($v, 'granite')) $add($internal, 'granite-countertops');
            if (str_contains($v, 'wine')) $add($internal, 'wine-cellar');
            if (str_contains($v, 'home office') || str_contains($v, 'den')) $add($internal, 'home-office');
            if (str_contains($v, 'skylight')) $add($internal, 'skylights');
        }

        // Exterior features
        foreach ((array)($reso['exteriorFeatures'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'patio')) $add($external, 'patio');
            if (str_contains($v, 'deck')) $add($external, 'deck');
            if (str_contains($v, 'outdoor kitchen')) $add($external, 'outdoor-kitchen');
            if (str_contains($v, 'sprinkler')) $add($external, 'sprinkler-system');
        }

        // Patio/porch
        foreach ((array)($reso['patioAndPorchFeatures'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'patio')) $add($external, 'patio');
            if (str_contains($v, 'deck')) $add($external, 'deck');
        }

        // Community features (amenities)
        foreach ((array)($reso['communityFeatures'] ?? $reso['associationAmenities'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'pool')) $add($amenity, 'swimming-pool');
            if (str_contains($v, 'gym') || str_contains($v, 'fitness')) $add($amenity, 'gym');
            if (str_contains($v, 'clubhouse')) $add($amenity, 'clubhouse');
            if (str_contains($v, 'tennis')) $add($amenity, 'tennis-court');
            if (str_contains($v, 'basketball')) $add($amenity, 'basketball-court');
            if (str_contains($v, 'sauna')) $add($amenity, 'sauna');
            if (str_contains($v, 'playground')) $add($amenity, 'playground');
        }

        // Lot features
        foreach ((array)($reso['lotFeatures'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'corner lot') || str_contains($v, 'landscap')) $add($external, 'landscaped-garden');
            if (str_contains($v, 'waterfront') || str_contains($v, 'water front')) $add($general, 'waterfront');
        }

        // View
        foreach ((array)($reso['viewDescription'] ?? $reso['view'] ?? []) as $v) {
            $v = strtolower($v);
            if (str_contains($v, 'ocean') || str_contains($v, 'water')) $add($general, 'ocean-view');
            if (str_contains($v, 'city') || str_contains($v, 'skyline')) $add($general, 'city-view');
            if (str_contains($v, 'mountain')) $add($general, 'mountain-view');
        }

        // Hot tub
        if (!empty($reso['hasSpa']) || !empty($reso['spaFeatures'])) {
            $add($external, 'hot-tub');
        }

        // Solar
        if (!empty($reso['hasSolarPanels'])) {
            $add($internal, 'solar-panels');
        }

        // Gated
        if (!empty($reso['hasGatedEntry'])) {
            $add($general, 'gated-community');
        }

        // New construction
        if (!empty($reso['newConstruction'])) {
            $add($general, 'new-construction');
        }
    }

    private function matchKeywords(string $text, array $map): array
    {
        $matched = [];
        foreach ($map as $keyword => $slug) {
            if (str_contains($text, $keyword) && !in_array($slug, $matched)) {
                $matched[] = $slug;
            }
        }
        return $matched;
    }

    private function generateDescription(array $d): string
    {
        $typeLabels = [
            'SINGLE_FAMILY' => 'single-family home',
            'CONDO'         => 'condominium',
            'TOWNHOUSE'     => 'townhouse',
            'MULTI_FAMILY'  => 'multi-family property',
            'LAND'          => 'land parcel',
            'MANUFACTURED'  => 'manufactured home',
            'APARTMENT'     => 'apartment',
        ];

        $type      = $typeLabels[strtoupper($d['homeType'] ?? '')] ?? 'property';
        $beds      = (int) ($d['bedrooms'] ?? 0);
        $baths     = (int) ($d['bathrooms'] ?? 0);
        $sqft      = (int) ($d['sqrFootage'] ?? 0);
        $year      = $d['yearBuilt'] ?? null;
        $city      = $d['city'] ?? '';
        $category  = $d['category'] ?? 'sold';
        $reso      = $d['reso'] ?? [];

        $parts = [];

        // Opening sentence
        $bedBath = implode(' and ', array_filter([
            $beds  ? "{$beds} bedroom" . ($beds > 1 ? 's' : '') : null,
            $baths ? "{$baths} bathroom" . ($baths > 1 ? 's' : '') : null,
        ]));
        $cityStr = $city ? " in {$city}" : '';
        $intro   = "This {$type}{$cityStr}";
        $intro  .= $bedBath ? " features {$bedBath}" : '';
        $intro  .= '.';
        $parts[] = $intro;

        // Size & year
        if ($sqft > 0 || $year) {
            $details = [];
            if ($sqft > 0) $details[] = number_format($sqft) . ' sq ft of living space';
            if ($year)     $details[] = "built in {$year}";
            $parts[] = 'With ' . implode(' and ', $details) . ', it offers comfortable living for the whole family.';
        }

        // Parking
        $hasGarage  = !empty($reso['hasGarage']) || ($reso['garageParkingCapacity'] ?? 0) > 0;
        $hasCarport = !empty($reso['hasCarport']) || ($reso['carportParkingCapacity'] ?? 0) > 0;
        $parkFeatures = array_map('strtolower', (array)($reso['parkingFeatures'] ?? []));
        $hasDriveway  = array_filter($parkFeatures, fn($f) => str_contains($f, 'driveway'));

        $parking = [];
        if ($hasGarage)   $parking[] = 'garage parking';
        if ($hasCarport)  $parking[] = 'carport';
        if ($hasDriveway) $parking[] = 'driveway';
        if ($parking) {
            $parts[] = 'The property includes ' . implode(' and ', $parking) . '.';
        }

        // Lot size
        $lotSize = $reso['lotSize'] ?? null;
        if ($lotSize) {
            $parts[] = "The lot size is {$lotSize}.";
        }

        // Status closing
        if ($category === 'sold') {
            $parts[] = 'This property was recently sold and represents excellent value in the area.';
        } elseif ($category === 'for_rent') {
            $parts[] = 'Available for rent — contact us for details and to schedule a showing.';
        } else {
            $parts[] = 'Do not miss this opportunity — contact us today to schedule a private tour.';
        }

        return implode(' ', $parts);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function parseNumber(mixed $val): float
    {
        if ($val === null) return 0.0;
        if (is_array($val)) $val = $val[0] ?? 0;
        if (is_numeric($val)) return (float) $val;
        $cleaned = preg_replace('/[^\d.]/', '', (string) $val);
        return $cleaned !== '' ? (float) $cleaned : 0.0;
    }

    private function normalizeCity(?string $city): ?string
    {
        if (!$city) return null;
        $c = strtolower(trim($city));
        if (str_contains($c, 'boca raton'))    return 'boca raton';
        if (str_contains($c, 'palm beach'))    return 'palm beach';
        if (str_contains($c, 'fort lauderdale')
            || str_contains($c, 'ft lauderdale')
            || str_contains($c, 'ft. lauderdale')) return 'fort lauderdale';
        if (str_contains($c, 'delray'))        return 'delray beach';
        if (str_contains($c, 'miami'))         return 'miami';
        return $c;
    }
}
