<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\SecurityLog;
use App\Services\FileStorageService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SecurityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = SecurityLog::with(['security', 'area.building'])->latest('checked_at');

        // Filter: Specific Date
        if ($request->filled('date')) {
            $query->whereDate('checked_at', $request->date);
        }

        // Filter: Date Range / Period
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('checked_at', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay(),
            ]);
        }

        // Filter: Status (Aman, Perlu Perhatian, Insiden)
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter: Building
        if ($request->filled('building_id') && $request->building_id !== 'all') {
            $query->whereHas('area', function ($aq) use ($request) {
                $aq->where('building_id', $request->building_id);
            });
        }

        // Filter: Area
        if ($request->filled('area_id') && $request->area_id !== 'all') {
            $query->where('area_id', $request->area_id);
        }

        // Filter: Floor
        if ($request->filled('floor') && $request->floor !== 'all') {
            $query->whereHas('area', function ($aq) use ($request) {
                $aq->where('floor', $request->floor);
            });
        }

        // Filter: Security personnel
        if ($request->filled('security_id') && $request->security_id !== 'all') {
            $query->where('security_id', $request->security_id);
        }

        // Search text
        if ($request->filled('search')) {
            $search = $request->search;
            $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('description', $like, "%{$search}%")
                  ->orWhere('notes', $like, "%{$search}%")
                  ->orWhereHas('area', function ($aq) use ($search, $like) {
                      $aq->where('name', $like, "%{$search}%")
                         ->orWhere('floor', $like, "%{$search}%")
                         ->orWhereHas('building', function ($bq) use ($search, $like) {
                             $bq->where('name', $like, "%{$search}%");
                         });
                  });
            });
        }

        $logs = $query->paginate($request->input('per_page', 20));

        $logs->getCollection()->transform(function ($log) {
            $log->photo_url = FileStorageService::formatUrl($log->photo);
            return $log;
        });

        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'security') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya petugas security yang berwenang mencatat pengecekan area.'
            ], 403);
        }

        $request->validate([
            'area_id' => 'required|exists:areas,id',
            'status' => 'required|in:Aman,Perlu Perhatian,Insiden',
            'description' => 'required|string',
            'photo' => 'required', // Uploaded file or base64 snapshot
            'notes' => 'nullable|string',
            'checked_at' => 'nullable|date',
        ]);

        $photoPath = FileStorageService::storePhoto($request->file('photo') ?? $request->input('photo'), 'security_checks');

        if (!$photoPath) {
            return response()->json(['message' => 'Foto kondisi area wajib diambil atau diunggah.'], 422);
        }

        $user = $request->user();

        $log = SecurityLog::create([
            'security_id' => $user->id,
            'area_id' => $request->area_id,
            'status' => $request->status,
            'description' => $request->description,
            'photo' => $photoPath,
            'checked_at' => $request->filled('checked_at') ? Carbon::parse($request->checked_at) : Carbon::now(),
            'notes' => $request->notes,
        ]);

        AuditLog::log(
            $user->id,
            'CREATE_SECURITY_LOG',
            'SECURITY_BOOK',
            "Patroli dicatat oleh {$user->name} pada area ID {$log->area_id} dengan status {$log->status}."
        );

        $log->load(['security', 'area.building']);
        $log->photo_url = FileStorageService::formatUrl($log->photo);

        return response()->json([
            'message' => 'Pengecekan keamanan gedung berhasil dicatat.',
            'log' => $log,
        ], 201);
    }

    public function show($id)
    {
        $log = SecurityLog::with(['security', 'area.building'])->findOrFail($id);
        $log->photo_url = FileStorageService::formatUrl($log->photo);

        return response()->json($log);
    }
}
