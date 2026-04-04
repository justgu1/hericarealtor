<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ListingExternalFeature;

class ExternalFeaturesSeeder extends Seeder
{
    public function run()
    {
        $features = [
            ['name' => 'Swimming Pool', 'slug' => 'swimming-pool'],
            ['name' => 'Patio', 'slug' => 'patio'],
            ['name' => 'Deck', 'slug' => 'deck'],
            ['name' => 'Outdoor Kitchen', 'slug' => 'outdoor-kitchen'],
            ['name' => 'Fire Pit', 'slug' => 'fire-pit'],
            ['name' => 'Landscaped Garden', 'slug' => 'landscaped-garden'],
            ['name' => 'Fenced Yard', 'slug' => 'fenced-yard'],
            ['name' => 'Gazebo', 'slug' => 'gazebo'],
            ['name' => 'Outdoor Lighting', 'slug' => 'outdoor-lighting'],
            ['name' => 'Sprinkler System', 'slug' => 'sprinkler-system'],
            ['name' => 'Hot Tub', 'slug' => 'hot-tub'],
            ['name' => 'Tennis Court', 'slug' => 'tennis-court'],
            ['name' => 'Basketball Court', 'slug' => 'basketball-court'],
            ['name' => 'Playground', 'slug' => 'playground'],
            ['name' => 'Greenhouse', 'slug' => 'greenhouse'],
            ['name' => 'Pond', 'slug' => 'pond'],
            ['name' => 'Dog Run', 'slug' => 'dog-run'],
            ['name' => 'Outdoor Shower', 'slug' => 'outdoor-shower'],
            ['name' => 'Solar Panels', 'slug' => 'solar-panels'],
            ['name' => 'Rainwater Harvesting', 'slug' => 'rainwater-harvesting'],
        ];

        foreach ($features as $feature) {
            ListingExternalFeature::create($feature);
        }
    }
}
