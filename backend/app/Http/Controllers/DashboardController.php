<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Guest;
use App\Models\SecurityLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();

        // 1. Guest Metrics
        $guestsToday = Guest::whereDate('submitted_at', $today)->count();
        $guestsThisWeek = Guest::where('submitted_at', '>=', $startOfWeek)->count();
        $guestsThisMonth = Guest::where('submitted_at', '>=', $startOfMonth)->count();
        $guestsCurrentlyIn = Guest::where('status', 'Sedang Berkunjung')->count();
        $totalInstitutions = Guest::distinct('institution')->count('institution');

        // Magang Metrics
        $magangToday = Guest::whereDate('submitted_at', $today)->where('category', 'magang')->count();
        $magangCurrentlyIn = Guest::where('status', 'Sedang Berkunjung')->where('category', 'magang')->count();
        $totalMagangMonth = Guest::where('submitted_at', '>=', $startOfMonth)->where('category', 'magang')->count();
        $totalTamuMonth = Guest::where('submitted_at', '>=', $startOfMonth)->where('category', '!=', 'magang')->count();

        // Status counts
        $guestStatusCounts = Guest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Kunjungan berdasarkan lantai
        $visitsByFloor = Guest::select('destination_floor as floor', DB::raw('count(*) as count'))
            ->groupBy('destination_floor')
            ->orderByDesc('count')
            ->get();

        // Kunjungan berdasarkan divisi
        $visitsByDivision = Guest::select('destination_division as division', DB::raw('count(*) as count'))
            ->groupBy('destination_division')
            ->orderByDesc('count')
            ->get();

        // 7-day trend (daily visitor count)
        $sevenDaysTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = Guest::whereDate('submitted_at', $date)->count();
            $sevenDaysTrend[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $date->translatedFormat('d M'),
                'count' => $count,
            ];
        }

        // 2. Security Metrics (Today)
        $securityChecksToday = SecurityLog::whereDate('checked_at', $today)->count();

        // Total active areas
        $allActiveAreas = Area::where('active', true)->get();
        $totalActiveAreasCount = $allActiveAreas->count();

        // Checked areas today
        $checkedAreaIdsToday = SecurityLog::whereDate('checked_at', $today)
            ->pluck('area_id')
            ->unique();
        $checkedAreasCount = $checkedAreaIdsToday->count();
        $uncheckedAreasCount = max(0, $totalActiveAreasCount - $checkedAreasCount);

        // Security Status counts today
        $statusAmanToday = SecurityLog::whereDate('checked_at', $today)->where('status', 'Aman')->count();
        $statusPerluPerhatianToday = SecurityLog::whereDate('checked_at', $today)->where('status', 'Perlu Perhatian')->count();
        $statusInsidenToday = SecurityLog::whereDate('checked_at', $today)->where('status', 'Insiden')->count();

        // All-time security status counts
        $statusAmanTotal = SecurityLog::where('status', 'Aman')->count();
        $statusPerluPerhatianTotal = SecurityLog::where('status', 'Perlu Perhatian')->count();
        $statusInsidenTotal = SecurityLog::where('status', 'Insiden')->count();

        // Recent guests
        $recentGuests = Guest::latest('submitted_at')->take(5)->get()->map(function ($g) {
            $g->identity_photo_url = $g->identity_photo ? asset('storage/' . $guestPhoto = $g->identity_photo) : null;
            return $g;
        });

        // Recent security checks
        $recentSecurityLogs = SecurityLog::with(['security', 'area.building'])->latest('checked_at')->take(5)->get()->map(function ($l) {
            $l->photo_url = $l->photo ? asset('storage/' . $l->photo) : null;
            return $l;
        });

        return response()->json([
            'guest_stats' => [
                'today' => $guestsToday,
                'this_week' => $guestsThisWeek,
                'this_month' => $guestsThisMonth,
                'currently_in' => $guestsCurrentlyIn,
                'total_institutions' => $totalInstitutions,
                'magang_today' => $magangToday,
                'magang_currently_in' => $magangCurrentlyIn,
                'total_magang_month' => $totalMagangMonth,
                'total_tamu_month' => $totalTamuMonth,
                'by_status' => $guestStatusCounts,
                'by_category' => [
                    'tamu' => $totalTamuMonth,
                    'magang' => $totalMagangMonth,
                ],
                'by_floor' => $visitsByFloor,
                'by_division' => $visitsByDivision,
                'trend' => $sevenDaysTrend,
            ],
            'security_stats' => [
                'checks_today' => $securityChecksToday,
                'total_areas' => $totalActiveAreasCount,
                'checked_areas_count' => $checkedAreasCount,
                'unchecked_areas_count' => $uncheckedAreasCount,
                'today_aman' => $statusAmanToday,
                'today_perlu_perhatian' => $statusPerluPerhatianToday,
                'today_insiden' => $statusInsidenToday,
                'total_aman' => $statusAmanTotal,
                'total_perlu_perhatian' => $statusPerluPerhatianTotal,
                'total_insiden' => $statusInsidenTotal,
            ],
            'recent_guests' => $recentGuests,
            'recent_security_logs' => $recentSecurityLogs,
        ]);
    }

    public function drilldown(Request $request)
    {
        $type = $request->input('type');
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        switch ($type) {
            case 'today_guests':
                $items = Guest::whereDate('submitted_at', $today)
                    ->latest('submitted_at')
                    ->get();
                $title = 'Tamu Hari Ini';
                $subtitle = 'Registrasi kunjungan seluruh tamu dan magang hari ini (' . $today->translatedFormat('d F Y') . ')';
                $category = 'guest';
                $linkTo = '/guests?date=' . $today->format('Y-m-d');
                break;

            case 'magang':
                $items = Guest::where('category', 'magang')
                    ->where('submitted_at', '>=', $startOfMonth)
                    ->latest('submitted_at')
                    ->get();
                $title = 'Anak Magang / PKL Bulan Ini';
                $subtitle = 'Daftar seluruh peserta magang dan PKL yang aktif pada bulan ini';
                $category = 'guest';
                $linkTo = '/guests?category=magang';
                break;

            case 'month_guests':
                $items = Guest::where('submitted_at', '>=', $startOfMonth)
                    ->latest('submitted_at')
                    ->get();
                $title = 'Tamu Bulan Ini';
                $subtitle = 'Akumulasi seluruh pengunjung terdaftar pada bulan ' . Carbon::now()->translatedFormat('F Y');
                $category = 'guest';
                $linkTo = '/guests';
                break;

            case 'currently_in':
                $items = Guest::where('status', 'Sedang Berkunjung')
                    ->latest('check_in_at')
                    ->get();
                $title = 'Pengunjung Sedang di Gedung';
                $subtitle = 'Daftar tamu dan anak magang yang sedang aktif berada di area gedung saat ini';
                $category = 'guest';
                $linkTo = '/guests?status=Sedang Berkunjung';
                break;

            case 'institutions':
                $items = Guest::select(
                    'institution',
                    DB::raw('count(*) as total_visits'),
                    DB::raw("sum(case when category = 'magang' then 1 else 0 end) as magang_visits"),
                    DB::raw("sum(case when status = 'Sedang Berkunjung' then 1 else 0 end) as currently_in"),
                    DB::raw('max(submitted_at) as last_visit')
                )
                    ->groupBy('institution')
                    ->orderByDesc('total_visits')
                    ->get();
                $title = 'Instansi Terdaftar';
                $subtitle = 'Rincian seluruh mitra, instansi korporasi, dan universitas yang tercatat';
                $category = 'institution';
                $linkTo = '/guests';
                break;

            case 'checks_today':
                $items = SecurityLog::with(['security', 'area'])
                    ->whereDate('checked_at', $today)
                    ->latest('checked_at')
                    ->get();
                $title = 'Pengecekan Patroli Hari Ini';
                $subtitle = 'Seluruh aktivitas patroli inspeksi area oleh security pada hari ini (' . $today->translatedFormat('d F Y') . ')';
                $category = 'security';
                $linkTo = '/security-book?date=' . $today->format('Y-m-d');
                break;

            case 'checked_areas':
                $checkedAreaIds = SecurityLog::whereDate('checked_at', $today)
                    ->pluck('area_id')
                    ->unique()
                    ->toArray();

                $items = Area::where('active', true)
                    ->whereIn('id', $checkedAreaIds)
                    ->orderBy('floor')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($area) use ($today) {
                        $latestLog = SecurityLog::with('security')
                            ->where('area_id', $area->id)
                            ->whereDate('checked_at', $today)
                            ->latest('checked_at')
                            ->first();

                        return [
                            'id' => $area->id,
                            'name' => $area->name,
                            'floor' => $area->floor,
                            'description' => $area->description,
                            'latest_status' => $latestLog?->status ?? 'Aman',
                            'checked_at' => $latestLog?->checked_at,
                            'security_name' => $latestLog?->security?->name ?? '-',
                            'notes' => $latestLog?->notes ?? $latestLog?->description,
                            'photo_url' => $latestLog?->photo ? asset('storage/' . $latestLog->photo) : null,
                        ];
                    });
                $title = 'Area Sudah Diperiksa Hari Ini';
                $subtitle = 'Daftar titik lokasi yang telah dikunjungi dan diinspeksi oleh petugas security hari ini';
                $category = 'area_checked';
                $linkTo = '/areas';
                break;

            case 'unchecked_areas':
                $checkedAreaIds = SecurityLog::whereDate('checked_at', $today)
                    ->pluck('area_id')
                    ->unique()
                    ->toArray();

                $items = Area::where('active', true)
                    ->whereNotIn('id', $checkedAreaIds)
                    ->orderBy('floor')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($area) {
                        return [
                            'id' => $area->id,
                            'name' => $area->name,
                            'floor' => $area->floor,
                            'description' => $area->description,
                            'status' => 'Perlu Patroli Shift Ini',
                        ];
                    });
                $title = 'Area Belum Diperiksa Hari Ini';
                $subtitle = 'Daftar lokasi gedung yang belum mendapatkan jadwal patroli pada shift hari ini';
                $category = 'area_unchecked';
                $linkTo = '/security-book';
                break;

            case 'all_aman':
                $items = SecurityLog::with(['security', 'area'])
                    ->where('status', 'Aman')
                    ->latest('checked_at')
                    ->take(50)
                    ->get();
                $title = 'Inspeksi Status Aman (All-Time)';
                $subtitle = 'Daftar inspeksi keamanan yang diverifikasi dalam kondisi aman dan kondusif';
                $category = 'security';
                $linkTo = '/security-book?status=Aman';
                break;

            case 'perlu_perhatian':
                $items = SecurityLog::with(['security', 'area'])
                    ->where('status', 'Perlu Perhatian')
                    ->latest('checked_at')
                    ->get();
                $title = 'Inspeksi Perlu Perhatian';
                $subtitle = 'Temuan patroli yang memerlukan atensi atau perbaikan fasilitas';
                $category = 'security';
                $linkTo = '/security-book?status=Perlu Perhatian';
                break;

            case 'insiden':
                $items = SecurityLog::with(['security', 'area'])
                    ->where('status', 'Insiden')
                    ->latest('checked_at')
                    ->get();
                $title = 'Insiden Keamanan Gedung';
                $subtitle = 'Laporan insiden abnormal yang membutuhkan penanganan darurat/khusus';
                $category = 'security';
                $linkTo = '/security-book?status=Insiden';
                break;

            default:
                return response()->json(['message' => 'Tipe drilldown tidak dikenali.'], 400);
        }

        if ($category === 'guest') {
            $items->transform(function ($g) {
                $g->identity_photo_url = $g->identity_photo ? asset('storage/' . $g->identity_photo) : null;
                $g->guest_photo_url = $g->guest_photo ? asset('storage/' . $g->guest_photo) : null;
                return $g;
            });
        } elseif ($category === 'security') {
            $items->transform(function ($l) {
                $l->photo_url = $l->photo ? asset('storage/' . $l->photo) : null;
                return $l;
            });
        }

        return response()->json([
            'type' => $type,
            'title' => $title,
            'subtitle' => $subtitle,
            'category' => $category,
            'link_to' => $linkTo,
            'total' => count($items),
            'items' => $items,
        ]);
    }
}
