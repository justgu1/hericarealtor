<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ListingInternalFeature;

class InternalFeaturesSeeder extends Seeder
{
    public function run()
    {
        $features = [
            ['name' => 'Air Conditioning', 'slug' => 'air-conditioning'],
            ['name' => 'Central Heating', 'slug' => 'central-heating'],
            ['name' => 'Fireplace', 'slug' => 'fireplace'],
            ['name' => 'Hardwood Floors', 'slug' => 'hardwood-floors'],
            ['name' => 'Walk-in Closet', 'slug' => 'walk-in-closet'],
            ['name' => 'High Ceilings', 'slug' => 'high-ceilings'],
            ['name' => 'Smart Thermostat', 'slug' => 'smart-thermostat'],
            ['name' => 'Home Theater', 'slug' => 'home-theater'],
            ['name' => 'Wine Cellar', 'slug' => 'wine-cellar'],
            ['name' => 'Laundry Room', 'slug' => 'laundry-room'],
            ['name' => 'Built-in Shelves', 'slug' => 'built-in-shelves'],
            ['name' => 'Energy Efficient Windows', 'slug' => 'energy-efficient-windows'],
            ['name' => 'Open Floor Plan', 'slug' => 'open-floor-plan'],
            ['name' => 'Granite Countertops', 'slug' => 'granite-countertops'],
            ['name' => 'Stainless Steel Appliances', 'slug' => 'stainless-steel-appliances'],
            ['name' => 'Jacuzzi Tub', 'slug' => 'jacuzzi-tub'],
            ['name' => 'Skylights', 'slug' => 'skylights'],
            ['name' => 'Solar Panels', 'slug' => 'solar-panels'],
            ['name' => 'Home Office', 'slug' => 'home-office'],
            ['name' => 'Soundproofing', 'slug' => 'soundproofing'],
        ];

        foreach ($features as $feature) {
            ListingInternalFeature::create($feature);
        }
    }
}
