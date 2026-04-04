<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadAttribute extends Model
{
    protected $fillable = ['lead_id', 'label', 'value'];
    protected $table = "leads_attributes";
    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}
