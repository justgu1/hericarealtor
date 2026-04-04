<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = ['name', 'email', 'message', 'form'];

    protected $table = "leads";

    // Relacionamento com os atributos do lead
    public function attributes()
    {
        return $this->hasMany(LeadAttribute::class);
    }
}
