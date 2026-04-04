<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ListingInternalFeature extends Model
{
    protected $table = 'listing_internal_features';
    protected $fillable = ['name', 'label'];

    public function listings()
    {
        return $this->belongsToMany(Listing::class, 'listings_internal_features_pivo', 'listing_internal_feature_id', 'listing_id');
    }
}
