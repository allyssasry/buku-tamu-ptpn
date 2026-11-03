<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'institution',
        'position',
        'phone',
        'email',
        'address',
        'notes',
        'category',
        'card_number',
        'purpose',
        'meeting_with',
        'destination_division',
        'destination_floor',
        'identity_type',
        'identity_number',
        'identity_photo',
        'guest_photo',
        'status',
        'consent',
        'submitted_at',
        'verified_at',
        'check_in_at',
        'check_out_at',
        'created_by',
        'verified_by',
        'checked_out_by',
    ];

    protected $casts = [
        'consent' => 'boolean',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function checkedOutBy()
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    public function identityDeposits()
    {
        return $this->hasMany(IdentityDeposit::class);
    }

    public function activeDeposit()
    {
        return $this->hasOne(IdentityDeposit::class)->where('status', 'Dititipkan')->latestOfMany();
    }
}
