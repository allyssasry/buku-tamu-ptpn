<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdentityDeposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'guest_id',
        'identity_type',
        'identity_number',
        'received_by',
        'deposited_at',
        'returned_by',
        'returned_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'deposited_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    protected $appends = ['masked_identity_number'];

    public function getMaskedIdentityNumberAttribute(): string
    {
        $num = trim($this->identity_number ?? '');
        if ($num === '' || $num === '-') {
            return '-';
        }
        $len = strlen($num);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }
        $prefix = substr($num, 0, 4);
        $suffix = substr($num, -2);
        return $prefix . str_repeat('*', max(0, $len - 6)) . $suffix;
    }

    public function guest()
    {
        return $this->belongsTo(Guest::class);
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }
}
