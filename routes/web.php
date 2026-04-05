<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\AmenityController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Models\Listing;
use App\Http\Controllers\BlogCategoryController;
use App\Http\Controllers\BlogTagController;
use App\Models\Amenity;
use App\Models\ListingExternalFeature;
use App\Models\ListingGeneralFeature;
use App\Models\ListingInternalFeature;
use App\Models\Post;
use App\Models\Review;
use Illuminate\Support\Facades\Auth;

require __DIR__ . '/auth.php';

Route::get('/', function () {
    $forSale = Listing::where('transaction_type', 0)->where('status', '!=', 4)->latest()->take(3)->get();
    $remaining = 3 - $forSale->count();
    $forRent = $remaining > 0
        ? Listing::where('transaction_type', 1)->where('status', '!=', 4)->latest()->take($remaining)->get()
        : collect();
    $featured = $forSale->merge($forRent);
    if ($featured->count() < 3) {
        $sold = Listing::where('status', 4)->latest()->take(3 - $featured->count())->get();
        $featured = $featured->merge($sold);
    }
    return Inertia::render('Home/index', [
        "listings" => $featured->values(),
        "posts" => Post::latest()->take(3)->get(),
        "reviews" => Review::latest()->take(10)->get(),
    ]);
})->name('Home');

Route::get('/properties', [ListingController::class, "properties"])->name('properties');

Route::get('/getProperties', [ListingController::class, "getProperties"])->name('getProperties');

Route::get('/properties/{listing}', [ListingController::class, "show"])->name('properties.show');

Route::post('/properties/pdf', [ListingController::class, 'pdf'])->name('properties.pdf');
Route::get('/properties/{listing}/pdf', [ListingController::class, 'pdf'])->name('properties.pdf.get');

Route::get('/neighborhood', function () {
    return Inertia::render('Neighborhood/index');
})->name('neighborhood');

Route::get('/seller', function () {
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
    return Inertia::render('Seller/index', [
        'apiKey' => config('app.google_maps_api_key'),
        'general_features' => $general_features,
        'internal_features' => $internal_features,
        'external_features' => $external_features,
        'amenities' => $amenities
    ]);
})->name('seller');

Route::get('/about', function () {
    return Inertia::render('About/index');
})->name('about');

Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');

// Blog section disabled — routes kept for potential future use
// Route::prefix("blog")->group(function () {
//     Route::get('/', [PostController::class, "list"])->name('blog');
//     Route::get('/{post}', [PostController::class, "show"])->name("blog.post");
// });

Route::get('/contact', function () {
    return Inertia::render('Contact/index');
})->name('contact');

Route::prefix('admin')->name('admin.')->group(function () {

    Route::get('/', function () {
        return Auth::check() ? redirect()->route('admin.dashboard') : redirect()->route('admin.login');
    });

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');
})->middleware('guest');

Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified'])->group(function () {

    Route::get('/', function () {
        return redirect()->route('admin.dashboard');
    });

    Route::get('/dashboard', [AdminController::class, "index"])->name('dashboard');

    Route::get('/settings', [AdminController::class, "settings"])->name('settings');
    Route::post('/settings', [AdminController::class, 'store'])->name('settings.update');

    Route::resource('leads', LeadController::class)->only([
        'index',
        'show',
    ]);

    Route::prefix("listings")->name('listings.')->group(function () {
        Route::get('add', [ListingController::class, "add"])->name('add');
        Route::get('edit/{listing}', [ListingController::class, "edit"])->name('edit');
        Route::get('import', [ListingController::class, "import"])->name('import');
        Route::get('export', [ListingController::class, "export"])->name('export');
        Route::post('update/{listing}', [ListingController::class, "update"])->name('update');

        Route::prefix('amenities')->name('amenities.')->group(function () {
            Route::get('/', [AmenityController::class, 'index'])->name('index');
            Route::get('add', [AmenityController::class, 'add'])->name('add');
            Route::post('/', [AmenityController::class, 'store'])->name('store');
            Route::get('edit/{amenity}', [AmenityController::class, 'edit'])->name('edit');
            Route::put('update/{amenity}', [AmenityController::class, 'update'])->name('update');
            Route::delete('{amenity}', [AmenityController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('features')->name('features.')->group(function () {
            Route::get('/', [FeatureController::class, 'index'])->name('index');
            Route::get('add', [FeatureController::class, 'add'])->name('add');
            Route::post('/', [FeatureController::class, 'store'])->name('store');
            Route::get('edit/{id}', [FeatureController::class, 'edit'])->name('edit');
            Route::put('update/{id}', [FeatureController::class, 'update'])->name('update');
            Route::delete('{id}', [FeatureController::class, 'destroy'])->name('destroy');
        });
    });

    Route::resource('listings', ListingController::class)->only([
        'index',
        'show',
        'store',
        'destroy'
    ]);

    Route::prefix("blog")->name('blog.')->group(function () {
        Route::prefix("posts")->name("posts.")->group(function () {
            Route::get("add", [PostController::class, "add"])->name("add");
            Route::get("edit/{post}", [PostController::class, "edit"])->name("edit");
            Route::post("update/{post}", [PostController::class, "update"])->name("update");
        });

        Route::resource("posts", PostController::class)->only([
            "index",
            "store",
            "destroy"
        ]);

        Route::prefix("categories")->name("categories.")->group(function () {
            Route::get("add", [BlogCategoryController::class, "add"])->name("add");
            Route::get("edit/{category}", [BlogCategoryController::class, "edit"])->name("edit");
        });

        Route::resource("categories", BlogCategoryController::class)->only([
            "index",
            "store",
            "update",
            "destroy"
        ]);

        Route::prefix("tags")->name("tags.")->group(function () {
            Route::get("add", [BlogTagController::class, "add"])->name("add");
            Route::get("edit/{tag}", [BlogTagController::class, "edit"])->name("edit");
        });

        Route::resource("tags", BlogTagController::class)->only([
            "index",
            "store",
            "update",
            "destroy"
        ]);
    });

    Route::prefix("reviews")->name("reviews.")->group(function () {
        Route::get("add", [ReviewController::class, "add"])->name("add");
        Route::get("edit/{review}", [ReviewController::class, "edit"])->name("edit");
    });

    Route::resource("reviews", ReviewController::class)->only([
        "index",
        "store",
        "update",
        "destroy"
    ]);
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
