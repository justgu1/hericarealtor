<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ListingExternalFeature extends Model
{
    protected $table = 'listing_external_features';
    protected $fillable = ['name', 'label'];

    public function listings()
    {
        return $this->belongsToMany(Listing::class, 'listings_external_features_pivo', 'listing_external_feature_id', 'listing_id');
    }
}

