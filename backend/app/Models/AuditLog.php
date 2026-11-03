<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'description',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log(?int $userId, string $action, string $module, string $description, ?string $ip = null, ?string $ua = null): self
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'ip_address' => $ip ?? request()->ip(),
            'user_agent' => $ua ?? request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
