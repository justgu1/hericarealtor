<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;
use App\Enums\ListingStatusEnum;
use App\Enums\ListingTypesEnum;
use App\Enums\ListingTransactionTypeEnum;

class Listing extends Model
{
    protected $fillable = [
        'mls',
        'address',
        'description',
        'style',
        'data_source',
        'sqr_footage',
        'price',
        'tax',
        'bedrooms',
        'bathrooms',
        'half_bathrooms',
        'status',
        'type',
        'transaction_type',
        'built_date',
        'thumbnail',
    ];

    protected $appends = [
        'status_enum',
        'type_enum',
        'transaction_type_enum',
        'thumbnail_url',
    ];

    public function amenities()
    {
        return $this->belongsToMany(Amenity::class, 'listings_amenities_pivo', 'listing_id', 'amenity_id');
    }

    public function internalFeatures()
    {
        return $this->belongsToMany(ListingInternalFeature::class, 'listings_internal_features_pivo', 'listing_id', 'listing_internal_feature_id');
    }

    public function externalFeatures()
    {
        return $this->belongsToMany(ListingExternalFeature::class, 'listings_external_features_pivo', 'listing_id', 'listing_external_feature_id');
    }

    public function generalFeatures()
    {
        return $this->belongsToMany(ListingGeneralFeature::class, 'listings_general_features_pivo', 'listing_id', 'listing_general_feature_id');
    }

    public function gallery()
    {
        return $this->hasMany(ListingGallery::class);
    }

    public function priceHistories(): MorphMany
    {
        return $this->morphMany(ListingPriceHistory::class, 'priceable');
    }

    public function updatePrice($newPrice)
    {
        $this->priceHistories()->create([
            'price' => $newPrice,
        ]);
        $this->price = $newPrice;
    }

    public function getStatusEnumAttribute()
    {
        $status = ListingStatusEnum::from($this->status);
        return [
            'value' => $status->value,
            'name' => ucfirst(str_replace('_', ' ', $status->name)),
        ];
    }

    public function getTypeEnumAttribute()
    {
        $type = ListingTypesEnum::from($this->type);
        return [
            'value' => $type->value,
            'name' => ucfirst(str_replace('_', ' ', $type->name)),
        ];
    }

    public function getTransactionTypeEnumAttribute()
    {
        $transactionType = ListingTransactionTypeEnum::from($this->transaction_type);
        return [
            'value' => $transactionType->value,
            'name' => ucfirst(str_replace('_', ' ', $transactionType->name)),
        ];
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumbnail) return null;
        if (str_starts_with($this->thumbnail, 'http')) return $this->thumbnail;
        return Storage::disk('s3')->url($this->thumbnail);
    }
}
