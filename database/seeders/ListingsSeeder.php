<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Listing;
use App\Models\ListingPriceHistory;
use App\Enums\CitiesEnum;
use Carbon\Carbon;

class ListingsSeeder extends Seeder
{
    public function run()
    {
        $addresses = [
            // Boca Raton
            "123 Palm Beach Parkway, Boca Raton, FL 33432",
            "456 South Military Trail, Boca Raton, FL 33486",
            "789 East Palmetto Park Road, Boca Raton, FL 33432",
            "1010 NW 15th Avenue, Boca Raton, FL 33486",
            "2020 Camino Real, Boca Raton, FL 33486",
            "3030 Spanish River Road, Boca Raton, FL 33431",
            "4040 NW 2nd Avenue, Boca Raton, FL 33431",
            "5050 NW 28th Way, Boca Raton, FL 33496",
            "6060 Boca Raton Boulevard, Boca Raton, FL 33433",
            "7070 NW 22nd Avenue, Boca Raton, FL 33434",

            // Miami
            "8080 Collins Avenue, Miami Beach, FL 33141",
            "9090 Biscayne Boulevard, Miami, FL 33138",
            "10101 Brickell Avenue, Miami, FL 33129",
            "11111 Lincoln Road, Miami Beach, FL 33139",
            "12121 South Miami Avenue, Miami, FL 33129",
            "13131 Flagler Street, Miami, FL 33135",
            "14141 Ponce de Leon Boulevard, Coral Gables, FL 33134",
            "15151 South Bayshore Drive, Miami, FL 33133",
            "16161 NW 37th Court, Miami, FL 33142",
            "17171 South 1st Avenue, Miami, FL 33135",

            // Pompano Beach
            "18181 NE 18th Avenue, Pompano Beach, FL 33060",
            "19191 West Atlantic Boulevard, Pompano Beach, FL 33064",
            "20202 South Cypress Road, Pompano Beach, FL 33069",
            "21212 East Sample Road, Pompano Beach, FL 33064",
            "22222 North Federal Highway, Pompano Beach, FL 33062",
            "23232 South Palm Aire Drive, Pompano Beach, FL 33069",
            "24242 North Ocean Boulevard, Pompano Beach, FL 33062",
            "25252 Southwest 8th Street, Pompano Beach, FL 33068",
            "26262 NW 9th Avenue, Pompano Beach, FL 33064",
            "27272 Northeast 13th Court, Pompano Beach, FL 33060",

            // Palm Beach
            "28282 Ocean Drive, Palm Beach, FL 33480",
            "29292 Worth Avenue, Palm Beach, FL 33480",
            "30303 Royal Palm Way, Palm Beach, FL 33480",
            "31313 S County Rd, Palm Beach, FL 33480",
            "32323 Brazilian Ave, Palm Beach, FL 33480",
            "33333 Cocoanut Row, Palm Beach, FL 33480",
            "34343 Seaview Ave, Palm Beach, FL 33480",
            "35353 Royal Poinciana Way, Palm Beach, FL 33480",
            "36363 N County Rd, Palm Beach, FL 33480",
            "37373 Peruvian Ave, Palm Beach, FL 33480",

            // Fort Lauderdale
            "38383 Las Olas Blvd, Fort Lauderdale, FL 33301",
            "39393 Sunrise Blvd, Fort Lauderdale, FL 33304",
            "40404 NE 4th Ave, Fort Lauderdale, FL 33334",
            "41414 Bayview Dr, Fort Lauderdale, FL 33308",
            "42424 Galt Ocean Dr, Fort Lauderdale, FL 33308",
            "43434 SW 9th Ave, Fort Lauderdale, FL 33315",
            "44444 NW 31st Ave, Fort Lauderdale, FL 33309",
            "45454 Marina Blvd, Fort Lauderdale, FL 33312",
            "46464 Riverland Rd, Fort Lauderdale, FL 33312",
            "47474 Davie Blvd, Fort Lauderdale, FL 33312",
        ];

        $listings = [];
        $index = 0;

        foreach (CitiesEnum::cases() as $city) {
            for ($i = 0; $i < 10; $i++) {
                $listings[] = [
                    'mls' => 'MLS' . ($index + 1),
                    'address' => $addresses[$index] ?? 'Unknown Address',
                    'city' => $city->value,
                    'description' => fake()->paragraphs(3, true),
                    'style' => 'Style ' . ($index + 1),
                    'data_source' => 'Source ' . ($index + 1),
                    'sqr_footage' => rand(1000, 5000),
                    'price' => rand(100000, 1000000),
                    'tax' => rand(1000, 10000),
                    'bedrooms' => rand(1, 5),
                    'bathrooms' => rand(1, 4),
                    'half_bathrooms' => rand(0, 2),
                    'status' => rand(0, 3),
                    'type' => rand(0, 14),
                    'transaction_type' => rand(0, 1),
                    'built_date' => Carbon::now()->subYears(rand(1, 50))->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $index++;
            }
        }

        Listing::insert($listings);

        Listing::all()->each(function ($listing) {
            $priceHistories = [];
            $numHistories = rand(1, 10);
            for ($i = 0; $i < $numHistories; $i++) {
                $priceHistories[] = [
                    'priceable_id' => $listing->id,
                    'priceable_type' => Listing::class,
                    'price' => rand(100000, 1000000),
                    'created_at' => now()->subDays(rand(1, 365)),
                    'updated_at' => now()->subDays(rand(1, 365)),
                ];
            }
            ListingPriceHistory::insert($priceHistories);
        });
    }
}
