<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ListingGeneralFeature extends Model
{
    protected $table = 'listing_general_features';
    protected $fillable = ['name', 'label'];

    public function listings()
    {
        return $this->belongsToMany(Listing::class, 'listings_general_features_pivo', 'listing_general_feature_id', 'listing_id');
    }
}

