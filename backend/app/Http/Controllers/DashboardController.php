<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Guest;
use App\Models\SecurityLog;
use App\Services\FileStorageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $startOfWeek = Carbon::now()->startOfWeek()->toDateTimeString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateTimeString();
        $sevenDaysAgo = Carbon::today()->subDays(6)->toDateString();

        // 1. Guest Metrics in single aggregate query
        $guestSummary = DB::table('guests')->selectRaw("
            COUNT(*) as total_all,
            COALESCE(SUM(CASE WHEN DATE(submitted_at) = ? THEN 1 ELSE 0 END), 0) as today,
            COALESCE(SUM(CASE WHEN submitted_at >= ? THEN 1 ELSE 0 END), 0) as this_week,
            COALESCE(SUM(CASE WHEN submitted_at >= ? THEN 1 ELSE 0 END), 0) as this_month,
            COALESCE(SUM(CASE WHEN status = 'Sedang Berkunjung' THEN 1 ELSE 0 END), 0) as currently_in,
            COUNT(DISTINCT institution) as total_institutions,
            COALESCE(SUM(CASE WHEN category = 'magang' AND DATE(submitted_at) = ? THEN 1 ELSE 0 END), 0) as magang_today,
            COALESCE(SUM(CASE WHEN category = 'magang' AND status = 'Sedang Berkunjung' THEN 1 ELSE 0 END), 0) as magang_currently_in,
            COALESCE(SUM(CASE WHEN category = 'magang' AND submitted_at >= ? THEN 1 ELSE 0 END), 0) as total_magang_month,
            COALESCE(SUM(CASE WHEN (category != 'magang' OR category IS NULL) AND submitted_at >= ? THEN 1 ELSE 0 END), 0) as total_tamu_month
        ", [$today, $startOfWeek, $startOfMonth, $today, $startOfMonth, $startOfMonth])->first();

        // Status counts
        $guestStatusCounts = DB::table('guests')
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Kunjungan berdasarkan lantai
        $visitsByFloor = DB::table('guests')
            ->select('destination_floor as floor', DB::raw('count(*) as count'))
            ->groupBy('destination_floor')
            ->orderByDesc('count')
            ->get();

        // Kunjungan berdasarkan divisi
        $visitsByDivision = DB::table('guests')
            ->select('destination_division as division', DB::raw('count(*) as count'))
            ->groupBy('destination_division')
            ->orderByDesc('count')
            ->get();

        // 7-day trend in 1 single grouped query
        $trendRows = DB::table('guests')
            ->selectRaw('DATE(submitted_at) as visit_date, COUNT(*) as count')
            ->where('submitted_at', '>=', $sevenDaysAgo)
            ->groupBy(DB::raw('DATE(submitted_at)'))
            ->pluck('count', 'visit_date')
            ->all();

        $sevenDaysTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $ymd = $date->format('Y-m-d');
            $sevenDaysTrend[] = [
                'date' => $ymd,
                'label' => $date->translatedFormat('d M'),
                'count' => (int) ($trendRows[$ymd] ?? 0),
            ];
        }

        // 2. Security Metrics in single aggregate query
        $secSummary = DB::table('security_logs')->selectRaw("
            COUNT(*) as total_checks,
            COALESCE(SUM(CASE WHEN DATE(checked_at) = ? THEN 1 ELSE 0 END), 0) as checks_today,
            COALESCE(SUM(CASE WHEN status = 'Aman' THEN 1 ELSE 0 END), 0) as total_aman,
            COALESCE(SUM(CASE WHEN status = 'Perlu Perhatian' THEN 1 ELSE 0 END), 0) as total_perlu_perhatian,
            COALESCE(SUM(CASE WHEN status = 'Insiden' THEN 1 ELSE 0 END), 0) as total_insiden,
            COALESCE(SUM(CASE WHEN DATE(checked_at) = ? AND status = 'Aman' THEN 1 ELSE 0 END), 0) as today_aman,
            COALESCE(SUM(CASE WHEN DATE(checked_at) = ? AND status = 'Perlu Perhatian' THEN 1 ELSE 0 END), 0) as today_perlu_perhatian,
            COALESCE(SUM(CASE WHEN DATE(checked_at) = ? AND status = 'Insiden' THEN 1 ELSE 0 END), 0) as today_insiden
        ", [$today, $today, $today, $today])->first();

        $totalActiveAreasCount = DB::table('areas')->where('active', 1)->count();
        $checkedAreasCount = DB::table('security_logs')
            ->whereDate('checked_at', $today)
            ->distinct()
            ->count('area_id');
        $uncheckedAreasCount = max(0, $totalActiveAreasCount - $checkedAreasCount);

        // Recent guests (lightweight select, stripping heavy data URLs before response)
        $recentGuests = Guest::select([
                'id', 'name', 'institution', 'position', 'category', 'card_number',
                'purpose', 'meeting_with', 'destination_division', 'destination_floor',
                'status', 'submitted_at', 'check_in_at', 'identity_photo', 'guest_photo'
            ])
            ->latest('submitted_at')
            ->take(5)
            ->get()
            ->map(function ($g) {
                $g->identity_photo_url = FileStorageService::formatUrl($g->identity_photo);
                $g->guest_photo_url = FileStorageService::formatUrl($g->guest_photo);
                unset($g->identity_photo);
                unset($g->guest_photo);
                return $g;
            });

        // Recent security checks
        $recentSecurityLogs = SecurityLog::with(['security:id,name', 'area:id,name,floor,building_id', 'area.building:id,name'])
            ->latest('checked_at')
            ->take(5)
            ->get()
            ->map(function ($l) {
                $l->photo_url = FileStorageService::formatUrl($l->photo);
                unset($l->photo);
                return $l;
            });

        return response()->json([
            'guest_stats' => [
                'today' => (int) ($guestSummary->today ?? 0),
                'this_week' => (int) ($guestSummary->this_week ?? 0),
                'this_month' => (int) ($guestSummary->this_month ?? 0),
                'currently_in' => (int) ($guestSummary->currently_in ?? 0),
                'total_institutions' => (int) ($guestSummary->total_institutions ?? 0),
                'magang_today' => (int) ($guestSummary->magang_today ?? 0),
                'magang_currently_in' => (int) ($guestSummary->magang_currently_in ?? 0),
                'total_magang_month' => (int) ($guestSummary->total_magang_month ?? 0),
                'total_tamu_month' => (int) ($guestSummary->total_tamu_month ?? 0),
                'by_status' => $guestStatusCounts,
                'by_category' => [
                    'tamu' => (int) ($guestSummary->total_tamu_month ?? 0),
                    'magang' => (int) ($guestSummary->total_magang_month ?? 0),
                ],
                'by_floor' => $visitsByFloor,
                'by_division' => $visitsByDivision,
                'trend' => $sevenDaysTrend,
            ],
            'security_stats' => [
                'checks_today' => (int) ($secSummary->checks_today ?? 0),
                'total_areas' => (int) $totalActiveAreasCount,
                'checked_areas_count' => (int) $checkedAreasCount,
                'unchecked_areas_count' => (int) $uncheckedAreasCount,
                'today_aman' => (int) ($secSummary->today_aman ?? 0),
                'today_perlu_perhatian' => (int) ($secSummary->today_perlu_perhatian ?? 0),
                'today_insiden' => (int) ($secSummary->today_insiden ?? 0),
                'total_aman' => (int) ($secSummary->total_aman ?? 0),
                'total_perlu_perhatian' => (int) ($secSummary->total_perlu_perhatian ?? 0),
                'total_insiden' => (int) ($secSummary->total_insiden ?? 0),
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
                $g->identity_photo_url = FileStorageService::formatUrl($g->identity_photo);
                $g->guest_photo_url = FileStorageService::formatUrl($g->guest_photo);
                unset($g->identity_photo);
                unset($g->guest_photo);
                return $g;
            });
        } elseif ($category === 'security') {
            $items->transform(function ($l) {
                $l->photo_url = FileStorageService::formatUrl($l->photo);
                unset($l->photo);
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
