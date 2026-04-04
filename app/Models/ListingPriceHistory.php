<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ListingPriceHistory extends Model
{
    protected $table = 'listing_price_histories';

    protected $fillable = ['price'];

    /**
     * Relacionamento polimórfico com Listings
     */
    public function priceable(): MorphTo
    {
        return $this->morphTo();
    }
}

