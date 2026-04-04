<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Amenity;

class AmenitiesSeeder extends Seeder
{
    public function run()
    {
        $amenities = [
            ['name' => 'Swimming Pool', 'slug' => 'swimming-pool'],
            ['name' => 'Gym', 'slug' => 'gym'],
            ['name' => 'Parking', 'slug' => 'parking'],
            ['name' => 'Security', 'slug' => 'security'],
            ['name' => 'Elevator', 'slug' => 'elevator'],
            ['name' => 'Balcony', 'slug' => 'balcony'],
            ['name' => 'Garden', 'slug' => 'garden'],
            ['name' => 'Playground', 'slug' => 'playground'],
            ['name' => 'BBQ Area', 'slug' => 'bbq-area'],
            ['name' => 'Clubhouse', 'slug' => 'clubhouse'],
            ['name' => 'Sauna', 'slug' => 'sauna'],
            ['name' => 'Jacuzzi', 'slug' => 'jacuzzi'],
            ['name' => 'Tennis Court', 'slug' => 'tennis-court'],
            ['name' => 'Basketball Court', 'slug' => 'basketball-court'],
            ['name' => 'Concierge', 'slug' => 'concierge'],
            ['name' => 'Pet Friendly', 'slug' => 'pet-friendly'],
            ['name' => 'Green Areas', 'slug' => 'green-areas'],
            ['name' => 'Bike Storage', 'slug' => 'bike-storage'],
            ['name' => 'Roof Terrace', 'slug' => 'roof-terrace'],
            ['name' => 'Smart Home', 'slug' => 'smart-home'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::create($amenity);
        }
    }
}
