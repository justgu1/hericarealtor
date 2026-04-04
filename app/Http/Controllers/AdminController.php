<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        return Inertia::render("Admin/Dashboard/index", []);
    }

    public function settings()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return Inertia::render("Admin/Settings/index", [
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'google_analytics' => 'nullable|string',
            'facebook_pixel' => 'nullable|string',
            'zillow_api_key' => 'nullable|string',
            'facebook_link' => 'nullable|url',
            'instagram_link' => 'nullable|url',
            'linkedin_link' => 'nullable|url',
            'youtube_link' => 'nullable|url',
            'whatsapp' => 'nullable|regex:/^\d{4}\d{3}\d{4}$/',
            'phone' => 'nullable|regex:/^\+\d{4}-\d{3}-\d{4}$/',
            'email' => 'nullable|email',
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
