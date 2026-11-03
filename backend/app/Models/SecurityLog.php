<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecurityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'security_id',
        'area_id',
        'status',
        'description',
        'photo',
        'checked_at',
        'notes',
    ];

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    public function security()
    {
        return $this->belongsTo(User::class, 'security_id');
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}
