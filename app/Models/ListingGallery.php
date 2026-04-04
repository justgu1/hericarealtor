<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ListingGallery extends Model
{
    protected $fillable = ['listing_id', 'image_path', 'position'];

    protected $table = 'listing_gallery';

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) return null;
        if (str_starts_with($this->image_path, 'http')) return $this->image_path;
        return Storage::disk('s3')->url($this->image_path);
    }
}
