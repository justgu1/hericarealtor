<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DefaultSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'google_analytics', 'value' => '67G3XLVC80'],
            ['key' => 'facebook_pixel', 'value' => '722501053449165'],
            ['key' => 'zillow_api_key', 'value' => ''],
            ['key' => 'facebook_link', 'value' => 'https://www.facebook.com/HericaDeOliveiraRealtor'],
            ['key' => 'youtube_link', 'value' => 'https://www.youtube.com/@HericaDeOliveiraRealtor'],
            ['key' => 'linkedin_link', 'value' => 'https://www.linkedin.com/in/hericadeoliveirarealtor'],
            ['key' => 'instagram_link', 'value' => 'https://www.instagram.com/hericadeoliveirarealtor'],
            ['key' => 'whatsapp', 'value' => '15085092287'],
            ['key' => 'phone', 'value' => '+1508-509-2287'],
            ['key' => 'email', 'value' => 'szguisantos@gmail.com'],

        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }
    }
}
