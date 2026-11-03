<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'name',
        'floor',
        'description',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function securityLogs()
    {
        return $this->hasMany(SecurityLog::class);
    }
}
