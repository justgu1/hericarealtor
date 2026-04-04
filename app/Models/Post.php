<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'content', 'thumbnail', 'status', 'timestamp', 'link'];
    protected $appends = ['thumbnail_url'];

    public static function boot()
    {
        parent::boot();
        static::creating(function ($post) {
            if (empty($post->link)) {
                $post->link = Str::slug($post->title . '-' . uniqid());
            }
        });
    }

    public function categories()
    {
        return $this->belongsToMany(BlogCategory::class, 'post_category', 'post_id', 'category_id');
    }

    public function tags()
    {
        return $this->belongsToMany(BlogTag::class, 'post_tag', 'post_id', 'tag_id');
    }

    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail ? Storage::url($this->thumbnail) : "/img/default.jpg";
    }
}
