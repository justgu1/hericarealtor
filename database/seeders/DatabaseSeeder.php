<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            DefaultSettingsSeeder::class,
            AdminUsersSeeder::class,
            AmenitiesSeeder::class,
            InternalFeaturesSeeder::class,
            ExternalFeaturesSeeder::class,
            GeneralFeaturesSeeder::class,
            // ListingsSeeder::class,      // fake() - dev only, not needed in prod
            // BlogCategorySeeder::class,  // blog section disabled
            // BlogTagSeeder::class,
            // PostSeeder::class,
        ]);
    }
}
