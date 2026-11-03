<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\IdentityDeposit;
use Carbon\Carbon;
use Illuminate\Http\Request;

class IdentityDepositController extends Controller
{
    public function index(Request $request)
    {
        $query = IdentityDeposit::with(['guest', 'receivedBy', 'returnedBy'])->latest('deposited_at');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('identity_number', $like, "%{$search}%")
                  ->orWhereHas('guest', function ($gq) use ($search, $like) {
                      $gq->where('name', $like, "%{$search}%")
                         ->orWhere('institution', $like, "%{$search}%");
                  });
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('deposited_at', $request->date);
        }

        $deposits = $query->paginate($request->input('per_page', 20));

        return response()->json($deposits);
    }

    public function store(Request $request)
    {
        $request->validate([
            'guest_id' => 'required|exists:guests,id',
            'identity_type' => 'required|string',
            'identity_number' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        // Check if there is already an active deposit for this guest
        $existing = IdentityDeposit::where('guest_id', $request->guest_id)
            ->where('status', 'Dititipkan')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Identitas tamu ini sudah dalam status dititipkan.'], 422);
        }

        $deposit = IdentityDeposit::create([
            'guest_id' => $request->guest_id,
            'identity_type' => $request->identity_type,
            'identity_number' => $request->identity_number,
            'received_by' => $user->id,
            'deposited_at' => Carbon::now(),
            'status' => 'Dititipkan',
            'notes' => $request->notes,
        ]);

        AuditLog::log(
            $user->id,
            'DEPOSIT_ID',
            'IDENTITY',
            "Security {$user->name} menerima titipan ID {$deposit->identity_type} untuk tamu ID {$deposit->guest_id}."
        );

        return response()->json([
            'message' => 'Penitipan ID berhasil dicatat.',
            'deposit' => $deposit->load(['guest', 'receivedBy']),
        ], 201);
    }

    public function returnDeposit(Request $request, $id)
    {
        $deposit = IdentityDeposit::findOrFail($id);
        $user = $request->user();

        if ($deposit->status === 'Sudah Dikembalikan') {
            return response()->json(['message' => 'Identitas ini sudah berstatus dikembalikan sebelumnya.'], 422);
        }

        $deposit->update([
            'status' => 'Sudah Dikembalikan',
            'returned_at' => Carbon::now(),
            'returned_by' => $user->id,
            'notes' => $request->filled('notes')
                ? ($deposit->notes ? $deposit->notes . ' | ' : '') . $request->notes
                : $deposit->notes,
        ]);

        AuditLog::log(
            $user->id,
            'RETURN_ID',
            'IDENTITY',
            "Security {$user->name} mengembalikan titipan ID kepada tamu {$deposit->guest?->name}."
        );

        return response()->json([
            'message' => 'KTP/ID berhasil dikembalikan ke tamu.',
            'deposit' => $deposit->load(['guest', 'receivedBy', 'returnedBy']),
        ]);
    }
}
