<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'description',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function areas()
    {
        return $this->hasMany(Area::class);
    }
}

