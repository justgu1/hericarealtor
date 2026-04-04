<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Amenity extends Model
{
    protected $table = 'listing_amenities';
    protected $fillable = ['name', 'slug'];

    public function listings()
    {
        return $this->belongsToMany(Listing::class, 'listings_amenities_pivo', 'amenity_id', 'listing_id');
    }
}
