<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Guest;
use App\Models\IdentityDeposit;
use App\Models\User;
use App\Services\FileStorageService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GuestController extends Controller
{
    /**
     * Get the next sequential looping available card number (001 - 050).
     * Continues forward from the last assigned card number up to 50, then wraps back to 001.
     * Skips any cards currently occupied by active guests.
     */
    public static function getNextAvailableCard(string $category): ?string
    {
        // 1. Get currently occupied cards for this category (status != 'Sudah Keluar' and status != 'Dibatalkan')
        $occupiedCards = Guest::where('category', $category)
            ->whereNotNull('card_number')
            ->where('card_number', '!=', '')
            ->whereNotIn('status', ['Sudah Keluar', 'Dibatalkan'])
            ->pluck('card_number')
            ->map(function ($c) {
                $trimmed = trim($c);
                return is_numeric($trimmed) ? str_pad((int)$trimmed, 3, '0', STR_PAD_LEFT) : $trimmed;
            })
            ->filter()
            ->all();

        $occupiedLookup = array_flip($occupiedCards);

        // 2. Find the most recently assigned card number for this category
        $latestGuestWithCard = Guest::where('category', $category)
            ->whereNotNull('card_number')
            ->where('card_number', '!=', '')
            ->latest('id')
            ->first();

        $lastNumber = 0;
        if ($latestGuestWithCard && is_numeric(trim($latestGuestWithCard->card_number))) {
            $lastNumber = (int)trim($latestGuestWithCard->card_number);
            if ($lastNumber < 1 || $lastNumber > 50) {
                $lastNumber = 0;
            }
        }

        // 3. Search starting from ($lastNumber % 50) + 1, looping through 50 candidates
        for ($i = 1; $i <= 50; $i++) {
            $candidateNum = (($lastNumber - 1 + $i) % 50) + 1;
            $candidateStr = str_pad($candidateNum, 3, '0', STR_PAD_LEFT);
            if (!isset($occupiedLookup[$candidateStr])) {
                return $candidateStr;
            }
        }

        return null; // All 50 cards are currently occupied
    }

    public function activeCards(Request $request)
    {
        $excludeGuestId = $request->query('exclude_guest_id');

        $activeGuests = Guest::whereNotNull('card_number')
            ->where('card_number', '!=', '')
            ->where('status', '!=', 'Sudah Keluar')
            ->when($excludeGuestId, fn($q) => $q->where('id', '!=', $excludeGuestId))
            ->get(['id', 'name', 'institution', 'card_number', 'status', 'category']);

        $tamuOccupied = [];
        $tamuDetails = [];
        $magangOccupied = [];
        $magangDetails = [];

        foreach ($activeGuests as $g) {
            $card = trim($g->card_number);
            if (is_numeric($card) && (int)$card >= 1 && (int)$card <= 50) {
                $card = str_pad((int)$card, 3, '0', STR_PAD_LEFT);
            }
            if ($card === '') continue;

            $item = [
                'guest_id' => $g->id,
                'name' => $g->name,
                'institution' => $g->institution,
                'status' => $g->status,
                'category' => $g->category,
            ];

            if ($g->category === 'magang') {
                $magangOccupied[] = $card;
                $magangDetails[$card] = $item;
            } else {
                $tamuOccupied[] = $card;
                $tamuDetails[$card] = $item;
            }
        }

        $nextTamu = self::getNextAvailableCard('tamu');
        $nextMagang = self::getNextAvailableCard('magang');

        return response()->json([
            'occupied' => array_values(array_unique(array_merge($tamuOccupied, $magangOccupied))),
            'details' => array_merge($tamuDetails, $magangDetails),
            'next_card' => [
                'tamu' => $nextTamu,
                'magang' => $nextMagang,
            ],
            'tamu' => [
                'occupied' => array_values(array_unique($tamuOccupied)),
                'details' => $tamuDetails,
                'next_card' => $nextTamu,
            ],
            'magang' => [
                'occupied' => array_values(array_unique($magangOccupied)),
                'details' => $magangDetails,
                'next_card' => $nextMagang,
            ],
        ]);
    }

    public function index(Request $request)
    {
        // Auto-heal legacy 'Terverifikasi' status to 'Sedang Berkunjung'
        // since verification by security now directly checks the visitor in
        Guest::where('status', 'Terverifikasi')->update([
            'status' => 'Sedang Berkunjung',
            'check_in_at' => DB::raw('COALESCE(check_in_at, verified_at, NOW())')
        ]);

        $query = Guest::with(['activeDeposit', 'verifiedBy', 'checkedOutBy'])->latest('submitted_at');

        // Filter: Date
        if ($request->filled('date')) {
            $query->whereDate('submitted_at', $request->date);
        }

        // Filter: Period (today, this_week, this_month)
        if ($request->filled('period') && $request->period !== 'all') {
            $period = $request->period;
            if ($period === 'today') {
                $query->whereDate('submitted_at', Carbon::today());
            } elseif ($period === 'this_week') {
                $query->where('submitted_at', '>=', Carbon::now()->startOfWeek());
            } elseif ($period === 'this_month') {
                $query->where('submitted_at', '>=', Carbon::now()->startOfMonth());
            }
        }

        // Filter: Date Range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('submitted_at', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay(),
            ]);
        }

        // Filter: Status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter: Category (tamu / magang)
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter: Floor
        if ($request->filled('floor') && $request->floor !== 'all') {
            $f = $request->floor;
            $query->where(function ($q) use ($f) {
                $q->where('destination_floor', $f)
                  ->orWhere('destination_floor', 'LIKE', "%{$f}%");
            });
        }

        // Filter: Division
        if ($request->filled('division') && $request->division !== 'all') {
            $query->where('destination_division', $request->division);
        }

        // Filter: Search (Name, Institution, Purpose, Meeting With, Card Number, Identity)
        if ($request->filled('search')) {
            $search = $request->search;
            $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                  ->orWhere('institution', $like, "%{$search}%")
                  ->orWhere('purpose', $like, "%{$search}%")
                  ->orWhere('meeting_with', $like, "%{$search}%")
                  ->orWhere('card_number', $like, "%{$search}%")
                  ->orWhere('identity_number', $like, "%{$search}%");
            });
        }

        // Today only shortcut
        if ($request->boolean('today_only')) {
            $query->whereDate('submitted_at', Carbon::today());
        }

        $guests = $query->paginate($request->input('per_page', 20));

        // Format photo indicators (strip heavy Base64 strings from listing to prevent Vercel 4.5MB payload limit)
        $guests->getCollection()->transform(function ($guest) {
            $guest->has_identity_photo = !empty($guest->identity_photo);
            $guest->has_guest_photo = !empty($guest->guest_photo);
            unset($guest->identity_photo);
            unset($guest->guest_photo);
            return $guest;
        });

        return response()->json($guests);
    }

    public function store(Request $request)
    {
        $isMagang = $request->input('category') === 'magang';
        $isIdPegawai = in_array($request->identity_type, ['ID Card', 'ID Pegawai']) || $isMagang;

        $request->validate([
            'name' => 'required|string|max:255',
            'institution' => $isMagang ? 'nullable|string|max:255' : 'required|string|max:255',
            'purpose' => $isMagang ? 'nullable|string' : 'required|string',
            'meeting_with' => $isMagang ? 'nullable|string|max:255' : 'required|string|max:255',
            'destination_division' => 'required|string|max:255',
            'destination_floor' => 'nullable|string|max:255',
            'identity_type' => $isMagang ? 'nullable|string' : 'required|string|in:KTP,SIM,ID Card,ID Pegawai,Passport,Lainnya',
            'identity_number' => 'nullable|string|regex:/^[0-9]*$/|max:100',
            'identity_photo' => 'nullable',
            'consent' => 'required|accepted',
            'position' => 'nullable|string|max:255',
            'phone' => $isMagang ? 'nullable|string|regex:/^[0-9]*$/|max:50' : 'required|string|regex:/^[0-9]+$/|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'category' => 'nullable|string|in:tamu,magang',
            'card_number' => 'nullable|string|max:100',
            'guest_photo' => 'required', // Foto diri wajib
        ], [
            'phone.required' => 'Nomor HP / WhatsApp wajib diisi.',
            'phone.regex' => 'Nomor HP / WhatsApp hanya boleh berisi angka.',
            'identity_number.regex' => 'Nomor identitas hanya boleh berisi angka.',
        ]);

        $isMagang = $request->input('category') === 'magang';
        $category = $isMagang ? 'magang' : 'tamu';

        $cardNumber = $request->filled('card_number') ? trim($request->card_number) : null;
        if ($cardNumber) {
            if (is_numeric($cardNumber) && (int)$cardNumber >= 1 && (int)$cardNumber <= 50) {
                $cardNumber = str_pad((int)$cardNumber, 3, '0', STR_PAD_LEFT);
            }
            $inUse = Guest::where('card_number', $cardNumber)
                ->where('category', $category)
                ->where('status', '!=', 'Sudah Keluar')
                ->first();

            if ($inUse) {
                $cardLabel = $isMagang ? 'Kartu Magang' : 'Kartu Tamu';
                return response()->json([
                    'message' => "Nomor {$cardLabel} {$cardNumber} sedang digunakan oleh {$inUse->name} ({$inUse->institution}) dan belum dikembalikan."
                ], 422);
            }
        } else {
            // Auto-assign next looping card number (001 - 050)
            $cardNumber = self::getNextAvailableCard($category);
        }

        $identityPhotoPath = ($request->hasFile('identity_photo') || $request->filled('identity_photo'))
            ? FileStorageService::storePhoto($request->file('identity_photo') ?? $request->input('identity_photo'), 'identities')
            : null;
        $guestPhotoPath = FileStorageService::storePhoto($request->file('guest_photo') ?? $request->input('guest_photo'), 'guests');

        if (!$guestPhotoPath) {
            return response()->json(['message' => 'Foto diri tamu wajib diambil atau diunggah.'], 422);
        }

        $now = Carbon::now();
        $userId = $request->user()?->id;

        $guestPayload = [
            'name' => $request->name,
            'institution' => $request->filled('institution') ? $request->institution : ($isMagang ? 'Siswa / Mahasiswa Magang' : '-'),
            'position' => $request->position,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
            'notes' => $request->notes,
            'category' => $category,
            'card_number' => $cardNumber,
            'purpose' => $request->filled('purpose') ? $request->purpose : ($isMagang ? 'Kegiatan Magang / PKL' : '-'),
            'meeting_with' => $request->filled('meeting_with') ? $request->meeting_with : ($isMagang ? 'Pembimbing Divisi' : '-'),
            'destination_division' => $request->destination_division,
            'destination_floor' => $request->filled('destination_floor') ? $request->destination_floor : ($isMagang ? 'Lantai Penempatan' : '-'),
            'identity_type' => $request->filled('identity_type') ? $request->identity_type : ($isMagang ? 'ID Card' : 'KTP'),
            'identity_number' => $request->filled('identity_number') ? trim($request->identity_number) : null,
            'identity_photo' => $identityPhotoPath,
            'guest_photo' => $guestPhotoPath,
            'status' => 'Menunggu Verifikasi', // Menunggu verifikasi petugas security di lobby
            'consent' => true,
            'submitted_at' => $now,
            'verified_at' => null,
            'check_in_at' => null,
            'created_by' => $userId,
            'verified_by' => null,
        ];

        $labelCategory = $category === 'magang' ? 'Anak Magang / PKL' : 'Tamu';
        $cardTypeStr = $category === 'magang' ? 'Kartu Magang' : 'Kartu Tamu';
        $cardLabel = $guestPayload['card_number'] ? " [No. {$cardTypeStr}: {$guestPayload['card_number']}]" : "";
        $idName = $isMagang ? 'KTP / Kartu Identitas Pelajar' : 'KTP';

        $persistGuest = function (?int $receiverId) use ($guestPayload, $isMagang, $now, $userId, $labelCategory, $cardLabel) {
            return DB::transaction(function () use ($guestPayload, $isMagang, $now, $userId, $receiverId, $labelCategory, $cardLabel) {
                $guest = Guest::create($guestPayload);

                // Otomatis catat penitipan identitas ke security untuk SEMUA (Tamu Umum & Anak Magang)
                IdentityDeposit::create([
                    'guest_id' => $guest->id,
                    'identity_type' => $guest->identity_type ?: ($isMagang ? 'ID Card / Kartu Pelajar' : 'KTP'),
                    'identity_number' => $guest->identity_number ?: '-',
                    'status' => 'Dititipkan',
                    'deposited_at' => $now,
                    'notes' => 'Dititipkan di pos security saat pengisian formulir kunjungan.',
                    'received_by' => $receiverId,
                ]);

                AuditLog::log(
                    $userId,
                    'CREATE_GUEST',
                    'GUEST',
                    "Registrasi {$labelCategory}: {$guest->name} dari {$guest->institution} ke {$guest->destination_division}. Menunggu verifikasi security.{$cardLabel}"
                );

                return $guest;
            });
        };

        try {
            $guest = $persistGuest($userId);
        } catch (QueryException $e) {
            // Self-heal if deployed DB still has NOT NULL on identity_deposits.received_by
            if ($userId === null && str_contains(strtolower($e->getMessage()), 'received_by')) {
                $repaired = $this->ensureReceivedByNullable();
                $fallbackId = $repaired ? null : (User::where('role', 'security')->value('id') ?? User::value('id'));
                $guest = $persistGuest($fallbackId);
            } else {
                throw $e;
            }
        }

        $successMsg = "Pendaftaran berhasil dicatat! Nomor {$cardTypeStr} Anda: {$guestPayload['card_number']}. Silakan menuju ke pos security lantai 11 untuk verifikasi identitas dan pengambilan kartu akses.";

        return response()->json([
            'message' => $successMsg,
            'guest' => $guest,
        ], 201);
    }

    /**
     * Allow identity_deposits.received_by to be NULL for public auto check-ins if migration has not run yet.
     */
    private function ensureReceivedByNullable(): bool
    {
        try {
            $driver = DB::connection()->getDriverName();
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                DB::statement('ALTER TABLE identity_deposits MODIFY COLUMN received_by BIGINT UNSIGNED NULL');
                return true;
            }
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE identity_deposits ALTER COLUMN received_by DROP NOT NULL');
                return true;
            }
        } catch (\Throwable $e) {
            // Fall back to existing staff user id if DDL is blocked.
        }
        return false;
    }

    public function show($id)
    {
        $guest = Guest::with(['identityDeposits.receivedBy', 'identityDeposits.returnedBy', 'verifiedBy', 'checkedOutBy'])->findOrFail($id);
        $guest->identity_photo_url = FileStorageService::formatUrl($guest->identity_photo);
        $guest->guest_photo_url = FileStorageService::formatUrl($guest->guest_photo);
        unset($guest->identity_photo);
        unset($guest->guest_photo);

        return response()->json($guest);
    }

    public function update(Request $request, $id)
    {
        $guest = Guest::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'institution' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|regex:/^[0-9]+$/|max:50',
            'purpose' => 'sometimes|required|string',
            'meeting_with' => 'sometimes|required|string|max:255',
            'destination_division' => 'sometimes|required|string|max:255',
            'destination_floor' => 'sometimes|required|string|max:255',
            'identity_type' => 'sometimes|required|string',
            'identity_number' => 'sometimes|nullable|string|regex:/^[0-9]*$/|max:100',
            'category' => 'sometimes|nullable|string|in:tamu,magang',
            'card_number' => 'sometimes|nullable|string|max:100',
            'notes' => 'nullable|string',
            'status' => 'sometimes|required|string',
        ], [
            'phone.required' => 'Nomor HP / WhatsApp wajib diisi.',
            'phone.regex' => 'Nomor HP / WhatsApp hanya boleh berisi angka.',
            'identity_number.regex' => 'Nomor identitas hanya boleh berisi angka.',
        ]);

        $data = $request->only([
            'name', 'institution', 'position', 'phone', 'email', 'address',
            'notes', 'category', 'card_number', 'purpose', 'meeting_with', 'destination_division',
            'destination_floor', 'identity_type', 'identity_number', 'status'
        ]);

        if ($request->has('card_number') && $request->filled('card_number')) {
            $cardNumber = trim($request->card_number);
            $cat = $request->input('category', $guest->category);
            $inUse = Guest::where('card_number', $cardNumber)
                ->where('category', $cat)
                ->where('status', '!=', 'Sudah Keluar')
                ->where('id', '!=', $id)
                ->first();

            if ($inUse) {
                $cardLabel = $cat === 'magang' ? 'Kartu Magang' : 'Kartu Tamu';
                return response()->json([
                    'message' => "Nomor {$cardLabel} {$cardNumber} sedang digunakan oleh {$inUse->name} ({$inUse->institution}) dan belum dikembalikan."
                ], 422);
            }
            $data['card_number'] = $cardNumber;
        }

        if ($request->hasFile('identity_photo') || $request->filled('identity_photo')) {
            $newPhoto = FileStorageService::storePhoto($request->file('identity_photo') ?? $request->input('identity_photo'), 'identities');
            if ($newPhoto) $data['identity_photo'] = $newPhoto;
        }

        if ($request->hasFile('guest_photo') || $request->filled('guest_photo')) {
            $newGuestPhoto = FileStorageService::storePhoto($request->file('guest_photo') ?? $request->input('guest_photo'), 'guests');
            if ($newGuestPhoto) $data['guest_photo'] = $newGuestPhoto;
        }

        $guest->update($data);

        AuditLog::log(
            $request->user()?->id,
            'UPDATE_GUEST',
            'GUEST',
            "Pembaruan data tamu ID {$guest->id} ({$guest->name})."
        );

        return response()->json([
            'message' => 'Data tamu berhasil diperbarui.',
            'guest' => $guest,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $guest = Guest::findOrFail($id);
        $name = $guest->name;
        $guest->delete();

        AuditLog::log(
            $request->user()?->id,
            'DELETE_GUEST',
            'GUEST',
            "Penghapusan data kunjungan tamu {$name} (ID: {$id})."
        );

        return response()->json(['message' => 'Data tamu berhasil dihapus.']);
    }

    public function verify(Request $request, $id)
    {
        $guest = Guest::findOrFail($id);
        $user = $request->user();
        $now = Carbon::now();

        $updateData = [
            'status' => 'Sedang Berkunjung', // Jika sudah diverifikasi oleh security berarti langsung Check-In (Sedang Berkunjung)
            'verified_at' => $now,
            'verified_by' => $user->id,
            'check_in_at' => $guest->check_in_at ?? $now,
        ];

        if ($request->filled('destination_floor')) {
            $updateData['destination_floor'] = $request->destination_floor;
        }

        if ($request->filled('card_number')) {
            $cardNumber = trim($request->card_number);
            if (is_numeric($cardNumber) && (int)$cardNumber >= 1 && (int)$cardNumber <= 50) {
                $cardNumber = str_pad((int)$cardNumber, 3, '0', STR_PAD_LEFT);
            }
            $cat = $request->input('category', $guest->category);
            $inUse = Guest::where('card_number', $cardNumber)
                ->where('category', $cat)
                ->where('status', '!=', 'Sudah Keluar')
                ->where('id', '!=', $id)
                ->first();

            if ($inUse) {
                $cardLabel = $cat === 'magang' ? 'Kartu Magang' : 'Kartu Tamu';
                return response()->json([
                    'message' => "Nomor {$cardLabel} {$cardNumber} sedang digunakan oleh {$inUse->name} ({$inUse->institution}) dan belum dikembalikan."
                ], 422);
            }
            $updateData['card_number'] = $cardNumber;
        } elseif (empty($guest->card_number)) {
            $updateData['card_number'] = self::getNextAvailableCard($guest->category);
        }

        if ($request->filled('category')) {
            $updateData['category'] = $request->category;
        }

        $guest->update($updateData);

        // Ensure identity deposit is assigned to verifying security officer
        $deposit = IdentityDeposit::where('guest_id', $guest->id)
            ->where('status', 'Dititipkan')
            ->first();

        if ($deposit) {
            $deposit->update([
                'received_by' => $user->id,
                'notes' => $request->input('deposit_notes', $deposit->notes ?: 'Diverifikasi oleh petugas security.'),
            ]);
        } elseif ($request->boolean('deposit_id', true)) {
            IdentityDeposit::create([
                'guest_id' => $guest->id,
                'identity_type' => $guest->identity_type ?: ($guest->category === 'magang' ? 'ID Card / Kartu Pelajar' : 'KTP'),
                'identity_number' => $guest->identity_number ?: '-',
                'received_by' => $user->id,
                'deposited_at' => Carbon::now(),
                'status' => 'Dititipkan',
                'notes' => $request->input('deposit_notes', 'Dititipkan saat verifikasi security.'),
            ]);
        }

        AuditLog::log(
            $user->id,
            'VERIFY_GUEST',
            'GUEST',
            "Security {$user->name} memverifikasi & check-in {$guest->name} ({$guest->institution})." . ($guest->card_number ? " [No. Kartu: {$guest->card_number}]" : "")
        );

        return response()->json([
            'message' => 'Tamu berhasil diverifikasi dan resmi check-in (Sedang Berkunjung).',
            'guest' => $guest->fresh(['activeDeposit', 'verifiedBy']),
        ]);
    }

    public function checkin(Request $request, $id)
    {
        $guest = Guest::findOrFail($id);
        $user = $request->user();

        $updateData = [
            'status' => 'Sedang Berkunjung',
            'check_in_at' => Carbon::now(),
            'verified_at' => $guest->verified_at ?? Carbon::now(),
            'verified_by' => $guest->verified_by ?? $user->id,
        ];

        if ($request->filled('destination_floor')) {
            $updateData['destination_floor'] = $request->destination_floor;
        }

        if ($request->filled('card_number')) {
            $cardNumber = trim($request->card_number);
            if (is_numeric($cardNumber) && (int)$cardNumber >= 1 && (int)$cardNumber <= 50) {
                $cardNumber = str_pad((int)$cardNumber, 3, '0', STR_PAD_LEFT);
            }
            $cat = $request->input('category', $guest->category);
            $inUse = Guest::where('card_number', $cardNumber)
                ->where('category', $cat)
                ->where('status', '!=', 'Sudah Keluar')
                ->where('id', '!=', $id)
                ->first();

            if ($inUse) {
                $cardLabel = $cat === 'magang' ? 'Kartu Magang' : 'Kartu Tamu';
                return response()->json([
                    'message' => "Nomor {$cardLabel} {$cardNumber} sedang digunakan oleh {$inUse->name} ({$inUse->institution}) dan belum dikembalikan."
                ], 422);
            }
            $updateData['card_number'] = $cardNumber;
        }

        if ($request->filled('category')) {
            $updateData['category'] = $request->category;
        }

        $guest->update($updateData);

        // Auto create deposit if not yet deposited and requested
        if ($request->boolean('deposit_id') && !$guest->activeDeposit) {
            IdentityDeposit::create([
                'guest_id' => $guest->id,
                'identity_type' => $guest->identity_type,
                'identity_number' => $guest->identity_number,
                'received_by' => $user->id,
                'deposited_at' => Carbon::now(),
                'status' => 'Dititipkan',
                'notes' => $request->input('deposit_notes', 'Dititipkan saat check-in tamu.'),
            ]);
        }

        AuditLog::log(
            $user->id,
            'CHECKIN_GUEST',
            'GUEST',
            "Tamu {$guest->name} resmi check-in masuk gedung." . ($guest->card_number ? " [No. Kartu: {$guest->card_number}]" : "")
        );

        return response()->json([
            'message' => 'Status tamu diubah menjadi Sedang Berkunjung.',
            'guest' => $guest->fresh(['activeDeposit']),
        ]);
    }

    public function checkout(Request $request, $id)
    {
        $guest = Guest::findOrFail($id);
        $user = $request->user();

        $guest->update([
            'status' => 'Sudah Keluar',
            'check_out_at' => Carbon::now(),
            'checked_out_by' => $user->id,
        ]);

        // Auto return any active identity deposit
        $activeDeposit = IdentityDeposit::where('guest_id', $guest->id)
            ->where('status', 'Dititipkan')
            ->first();

        if ($activeDeposit) {
            $activeDeposit->update([
                'status' => 'Sudah Dikembalikan',
                'returned_at' => Carbon::now(),
                'returned_by' => $user->id,
                'notes' => ($activeDeposit->notes ? $activeDeposit->notes . ' | ' : '') . 'Dikembalikan otomatis saat tamu check-out.',
            ]);
        }

        AuditLog::log(
            $user->id,
            'CHECKOUT_GUEST',
            'GUEST',
            "Tamu {$guest->name} telah checkout keluar gedung."
        );

        return response()->json([
            'message' => 'Tamu berhasil check-out dan identitas telah tercatat dikembalikan.',
            'guest' => $guest->fresh(['identityDeposits']),
        ]);
    }

    public function photo($id)
    {
        $guest = Guest::select(['id', 'guest_photo'])->find($id);
        if (!$guest || empty($guest->guest_photo)) {
            return response('', 404);
        }

        return $this->streamPhoto($guest->guest_photo);
    }

    public function identityPhoto($id)
    {
        $guest = Guest::select(['id', 'identity_photo'])->find($id);
        if (!$guest || empty($guest->identity_photo)) {
            return response('', 404);
        }

        return $this->streamPhoto($guest->identity_photo);
    }

    private function streamPhoto(string $photoData)
    {
        if (str_starts_with($photoData, 'data:image')) {
            @list($meta, $content) = explode(',', $photoData, 2);
            $mime = 'image/jpeg';
            if (preg_match('/data:(image\/[a-zA-Z0-9.+_-]+);base64/', $meta, $matches)) {
                $mime = $matches[1];
            }
            $binary = base64_decode($content);
            return response($binary, 200, [
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($photoData)) {
            return \Illuminate\Support\Facades\Storage::disk('public')->response($photoData);
        }

        return redirect($photoData);
    }
}
