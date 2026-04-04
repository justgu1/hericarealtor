<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ListingGeneralFeature;

class GeneralFeaturesSeeder extends Seeder
{
    public function run()
    {
        $features = [
            ['name' => 'Security System', 'slug' => 'security-system'],
            ['name' => 'Smart Home', 'slug' => 'smart-home'],
            ['name' => 'Energy Efficient', 'slug' => 'energy-efficient'],
            ['name' => 'Waterfront', 'slug' => 'waterfront'],
            ['name' => 'Mountain View', 'slug' => 'mountain-view'],
            ['name' => 'City View', 'slug' => 'city-view'],
            ['name' => 'Ocean View', 'slug' => 'ocean-view'],
            ['name' => 'Gated Community', 'slug' => 'gated-community'],
            ['name' => 'Pet Friendly', 'slug' => 'pet-friendly'],
            ['name' => 'Eco-Friendly', 'slug' => 'eco-friendly'],
            ['name' => 'Historic Property', 'slug' => 'historic-property'],
            ['name' => 'New Construction', 'slug' => 'new-construction'],
            ['name' => 'Renovated', 'slug' => 'renovated'],
            ['name' => 'Furnished', 'slug' => 'furnished'],
            ['name' => 'Unfurnished', 'slug' => 'unfurnished'],
            ['name' => 'Wheelchair Accessible', 'slug' => 'wheelchair-accessible'],
            ['name' => 'Senior Living', 'slug' => 'senior-living'],
            ['name' => 'Student Housing', 'slug' => 'student-housing'],
            ['name' => 'Vacation Rental', 'slug' => 'vacation-rental'],
            ['name' => 'Investment Property', 'slug' => 'investment-property'],
        ];

        foreach ($features as $feature) {
            ListingGeneralFeature::create($feature);
        }
    }
}
