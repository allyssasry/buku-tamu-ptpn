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

        // Kunjungan berdasarkan lantai (chart & simple list)
        $visitsByFloor = DB::table('guests')
            ->select('destination_floor as floor', DB::raw('count(*) as count'))
            ->groupBy('destination_floor')
            ->orderByDesc('count')
            ->get();

        // Kunjungan berdasarkan divisi (chart & simple list)
        $visitsByDivision = DB::table('guests')
            ->select('destination_division as division', DB::raw('count(*) as count'))
            ->groupBy('destination_division')
            ->orderByDesc('count')
            ->get();

        // Rekapan Komprehensif Per Lantai (Lantai 11, Lantai 15, Lantai 16, dll.)
        $rawFloorRows = DB::table('guests')
            ->select(
                'destination_floor as floor',
                DB::raw('COUNT(*) as total'),
                DB::raw("COALESCE(SUM(CASE WHEN status = 'Sedang Berkunjung' THEN 1 ELSE 0 END), 0) as currently_in"),
                DB::raw("COALESCE(SUM(CASE WHEN DATE(submitted_at) = '$today' THEN 1 ELSE 0 END), 0) as today"),
                DB::raw("COALESCE(SUM(CASE WHEN submitted_at >= '$startOfMonth' THEN 1 ELSE 0 END), 0) as this_month"),
                DB::raw("COALESCE(SUM(CASE WHEN category = 'magang' THEN 1 ELSE 0 END), 0) as magang_count")
            )
            ->whereNotNull('destination_floor')
            ->where('destination_floor', '!=', '')
            ->where('destination_floor', '!=', '-')
            ->groupBy('destination_floor')
            ->orderByDesc('currently_in')
            ->orderByDesc('total')
            ->get();

        // Relasi Lantai ke Divisi Tujuan
        $floorDivisionPairs = DB::table('guests')
            ->select(
                'destination_floor as floor',
                'destination_division as division',
                DB::raw('COUNT(*) as total'),
                DB::raw("COALESCE(SUM(CASE WHEN status = 'Sedang Berkunjung' THEN 1 ELSE 0 END), 0) as currently_in")
            )
            ->whereNotNull('destination_floor')
            ->where('destination_floor', '!=', '')
            ->where('destination_floor', '!=', '-')
            ->groupBy('destination_floor', 'destination_division')
            ->orderByDesc('total')
            ->get();

        $divisionsByFloor = [];
        $floorsByDivision = [];
        foreach ($floorDivisionPairs as $pair) {
            $f = $pair->floor;
            $d = $pair->division ?: 'Umum / Lainnya';
            if (!isset($divisionsByFloor[$f])) {
                $divisionsByFloor[$f] = [];
            }
            $divisionsByFloor[$f][] = [
                'division' => $d,
                'total' => (int) $pair->total,
                'currently_in' => (int) $pair->currently_in,
            ];

            if (!isset($floorsByDivision[$d])) {
                $floorsByDivision[$d] = [];
            }
            $floorsByDivision[$d][] = [
                'floor' => $f,
                'total' => (int) $pair->total,
                'currently_in' => (int) $pair->currently_in,
            ];
        }

        $floorMonitoring = $rawFloorRows->map(function ($item) use ($divisionsByFloor) {
            return [
                'floor' => $item->floor,
                'total' => (int) $item->total,
                'currently_in' => (int) $item->currently_in,
                'today' => (int) $item->today,
                'this_month' => (int) $item->this_month,
                'magang_count' => (int) $item->magang_count,
                'divisions' => $divisionsByFloor[$item->floor] ?? [],
            ];
        })->values();

        // Key Floors: Lantai 11, Lantai 15, Lantai 16
        $findFloorData = function ($pattern, $label) use ($floorMonitoring) {
            $match = $floorMonitoring->first(function ($f) use ($pattern) {
                return str_contains(strtolower($f['floor']), strtolower($pattern));
            });
            if ($match) {
                return $match;
            }
            return [
                'floor' => $label,
                'total' => 0,
                'currently_in' => 0,
                'today' => 0,
                'this_month' => 0,
                'magang_count' => 0,
                'divisions' => [],
            ];
        };

        $keyFloors = [
            'floor_11' => $findFloorData('11', 'Lantai 11'),
            'floor_15' => $findFloorData('15', 'Lantai 15'),
            'floor_16' => $findFloorData('16', 'Lantai 16 (Rooftop)'),
        ];

        // 19 Official Divisions & Directors requested by user
        $officialDivisions = [
            'Direktur SDM dan Umum',
            'Direktur Keuangan dan Manajemen Risiko',
            'Direktur Aset',
            'Direktur Produksi dan Pengembangan',
            'Direktur Bisnis',
            'Divisi Akuntansi dan Perpajakan',
            'Divisi Aneka Tanaman',
            'Divisi Hubungan Kelembagaan dan Hukum',
            'Divisi Manajemen Risiko',
            'Divisi Keuangan Strategis dan Anggaran',
            'Divisi Kelapa Sawit dan Karet',
            'Divisi Manajemen Aset',
            'Divisi Strategi dan Pengembangan SDM',
            'Divisi Operasional SDM',
            'Divisi Pengadaan dan Umum',
            'PMO Pengembangan Komoditi dan Hilirisasi',
            'Divisi Transformasi Digital',
            'Divisi Pemasaran dan Penjualan',
            'Divisi Strategi dan Manajemen Kinerja Korporasi',
        ];

        // Fetch all active guests with floor & division for accurate mapping
        $allGuestDivRows = DB::table('guests')
            ->select('destination_division', 'destination_floor', 'status', 'submitted_at', 'meeting_with')
            ->get();

        $divisionStats = [];
        foreach ($officialDivisions as $div) {
            $divisionStats[$div] = [
                'division' => $div,
                'is_direksi' => str_starts_with($div, 'Direktur'),
                'total' => 0,
                'currently_in' => 0,
                'today' => 0,
                'this_month' => 0,
                'floors' => [],
            ];
        }

        // Helper to match a guest's destination_division or meeting_with to one of the 19 official divisions
        $mapToOfficialDivision = function ($destDiv, $meetingWith) use ($officialDivisions) {
            $destTrim = trim($destDiv ?? '');
            $meetTrim = trim($meetingWith ?? '');

            // 1. Direct exact match
            foreach ($officialDivisions as $od) {
                if (strcasecmp($destTrim, $od) === 0) {
                    return $od;
                }
            }

            // 2. Match specific Direktur
            if (str_contains(strtolower($destTrim), 'sdm') && (str_contains(strtolower($destTrim), 'direkt') || str_contains(strtolower($meetTrim), 'direkt'))) {
                return 'Direktur SDM dan Umum';
            }
            if (str_contains(strtolower($destTrim), 'keuangan') && (str_contains(strtolower($destTrim), 'direkt') || str_contains(strtolower($meetTrim), 'direkt'))) {
                return 'Direktur Keuangan dan Manajemen Risiko';
            }
            if (str_contains(strtolower($destTrim), 'aset') && (str_contains(strtolower($destTrim), 'direkt') || str_contains(strtolower($meetTrim), 'direkt'))) {
                return 'Direktur Aset';
            }
            if ((str_contains(strtolower($destTrim), 'produksi') || str_contains(strtolower($destTrim), 'pengembangan')) && (str_contains(strtolower($destTrim), 'direkt') || str_contains(strtolower($meetTrim), 'direkt'))) {
                return 'Direktur Produksi dan Pengembangan';
            }
            if (str_contains(strtolower($destTrim), 'bisnis') && (str_contains(strtolower($destTrim), 'direkt') || str_contains(strtolower($meetTrim), 'direkt'))) {
                return 'Direktur Bisnis';
            }

            // 3. Match divisions keywords
            $lookupMap = [
                'akuntansi' => 'Divisi Akuntansi dan Perpajakan',
                'pajak' => 'Divisi Akuntansi dan Perpajakan',
                'aneka tanaman' => 'Divisi Aneka Tanaman',
                'hukum' => 'Divisi Hubungan Kelembagaan dan Hukum',
                'legal' => 'Divisi Hubungan Kelembagaan dan Hukum',
                'kelembagaan' => 'Divisi Hubungan Kelembagaan dan Hukum',
                'manajemen risiko' => 'Divisi Manajemen Risiko',
                'keuangan strategis' => 'Divisi Keuangan Strategis dan Anggaran',
                'anggaran' => 'Divisi Keuangan Strategis dan Anggaran',
                'keuangan' => 'Divisi Keuangan Strategis dan Anggaran',
                'sawit' => 'Divisi Kelapa Sawit dan Karet',
                'karet' => 'Divisi Kelapa Sawit dan Karet',
                'manajemen aset' => 'Divisi Manajemen Aset',
                'strategi dan pengembangan sdm' => 'Divisi Strategi dan Pengembangan SDM',
                'strategi sdm' => 'Divisi Strategi dan Pengembangan SDM',
                'operasional sdm' => 'Divisi Operasional SDM',
                'human capital' => 'Divisi Operasional SDM',
                'pengadaan' => 'Divisi Pengadaan dan Umum',
                'umum' => 'Divisi Pengadaan dan Umum',
                'pmo' => 'PMO Pengembangan Komoditi dan Hilirisasi',
                'komoditi' => 'PMO Pengembangan Komoditi dan Hilirisasi',
                'hilirisasi' => 'PMO Pengembangan Komoditi dan Hilirisasi',
                'transformasi' => 'Divisi Transformasi Digital',
                'digital' => 'Divisi Transformasi Digital',
                'it infrastructure' => 'Divisi Transformasi Digital',
                'it' => 'Divisi Transformasi Digital',
                'ti' => 'Divisi Transformasi Digital',
                'pemasaran' => 'Divisi Pemasaran dan Penjualan',
                'penjualan' => 'Divisi Pemasaran dan Penjualan',
                'kinerja' => 'Divisi Strategi dan Manajemen Kinerja Korporasi',
            ];

            $lower = strtolower($destTrim);
            foreach ($lookupMap as $keyword => $targetOfficial) {
                if (str_contains($lower, $keyword)) {
                    return $targetOfficial;
                }
            }

            // Check if matches generic 'direksi'
            if (str_contains($lower, 'direks')) {
                return 'Direktur SDM dan Umum';
            }

            return $destTrim ?: 'Divisi Pengadaan dan Umum';
        };

        $floorCountsByDiv = [];

        foreach ($allGuestDivRows as $row) {
            $mapped = $mapToOfficialDivision($row->destination_division, $row->meeting_with);
            if (!isset($divisionStats[$mapped])) {
                $divisionStats[$mapped] = [
                    'division' => $mapped,
                    'is_direksi' => str_starts_with($mapped, 'Direktur'),
                    'total' => 0,
                    'currently_in' => 0,
                    'today' => 0,
                    'this_month' => 0,
                    'floors' => [],
                ];
            }

            $divisionStats[$mapped]['total']++;
            if ($row->status === 'Sedang Berkunjung') {
                $divisionStats[$mapped]['currently_in']++;
            }
            if ($row->submitted_at && Carbon::parse($row->submitted_at)->isToday()) {
                $divisionStats[$mapped]['today']++;
            }
            if ($row->submitted_at && Carbon::parse($row->submitted_at)->gte(Carbon::now()->startOfMonth())) {
                $divisionStats[$mapped]['this_month']++;
            }

            if (!empty($row->destination_floor) && $row->destination_floor !== '-') {
                $fl = $row->destination_floor;
                if (!isset($floorCountsByDiv[$mapped])) {
                    $floorCountsByDiv[$mapped] = [];
                }
                $floorCountsByDiv[$mapped][$fl] = ($floorCountsByDiv[$mapped][$fl] ?? 0) + 1;
            }
        }

        // Attach floor breakdown
        foreach ($divisionStats as $divName => &$stat) {
            $floorsList = [];
            if (isset($floorCountsByDiv[$divName])) {
                foreach ($floorCountsByDiv[$divName] as $flName => $flCount) {
                    $floorsList[] = [
                        'floor' => $flName,
                        'total' => $flCount,
                    ];
                }
            }
            $stat['floors'] = $floorsList;
        }
        unset($stat);

        // Sort so all 19 official divisions appear in user's specified order
        $orderedDivisionMonitoring = [];
        foreach ($officialDivisions as $od) {
            if (isset($divisionStats[$od])) {
                $orderedDivisionMonitoring[] = $divisionStats[$od];
                unset($divisionStats[$od]);
            }
        }
        foreach ($divisionStats as $remaining) {
            $orderedDivisionMonitoring[] = $remaining;
        }

        $divisionMonitoring = $orderedDivisionMonitoring;

        // Calculate Direksi group aggregate (sum of all 5 Direktur)
        $direksiTotal = 0;
        $direksiCurrent = 0;
        $direksiToday = 0;
        $direksiMonth = 0;
        foreach ($divisionMonitoring as $item) {
            if ($item['is_direksi']) {
                $direksiTotal += $item['total'];
                $direksiCurrent += $item['currently_in'];
                $direksiToday += $item['today'];
                $direksiMonth += $item['this_month'];
            }
        }

        // Helper to find division data from ordered list
        $getDivStat = function ($divName) use ($orderedDivisionMonitoring) {
            foreach ($orderedDivisionMonitoring as $dm) {
                if ($dm['division'] === $divName) {
                    return $dm;
                }
            }
            return ['total' => 0, 'currently_in' => 0, 'today' => 0, 'this_month' => 0];
        };

        $tiStat = $getDivStat('Divisi Transformasi Digital');
        $keuStat = $getDivStat('Divisi Keuangan Strategis dan Anggaran');
        $pengadaanStat = $getDivStat('Divisi Pengadaan dan Umum');

        $keyDivisions = [
            'direksi' => [
                'division' => 'Jajaran Direksi (5 Direktur)',
                'total' => $direksiTotal,
                'currently_in' => $direksiCurrent,
                'today' => $direksiToday,
                'this_month' => $direksiMonth,
            ],
            'ti' => [
                'division' => 'Divisi Transformasi Digital',
                'total' => (int) ($tiStat['total'] ?? 0),
                'currently_in' => (int) ($tiStat['currently_in'] ?? 0),
                'today' => (int) ($tiStat['today'] ?? 0),
                'this_month' => (int) ($tiStat['this_month'] ?? 0),
            ],
            'keuangan' => [
                'division' => 'Divisi Keuangan Strategis dan Anggaran',
                'total' => (int) ($keuStat['total'] ?? 0),
                'currently_in' => (int) ($keuStat['currently_in'] ?? 0),
                'today' => (int) ($keuStat['today'] ?? 0),
                'this_month' => (int) ($keuStat['this_month'] ?? 0),
            ],
            'pengadaan' => [
                'division' => 'Divisi Pengadaan dan Umum',
                'total' => (int) ($pengadaanStat['total'] ?? 0),
                'currently_in' => (int) ($pengadaanStat['currently_in'] ?? 0),
                'today' => (int) ($pengadaanStat['today'] ?? 0),
                'this_month' => (int) ($pengadaanStat['this_month'] ?? 0),
            ],
        ];

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
                'floor_monitoring' => $floorMonitoring,
                'key_floors' => $keyFloors,
                'division_monitoring' => $divisionMonitoring,
                'key_divisions' => $keyDivisions,
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
        $scheme = ($request->isSecure() || $request->header('x-forwarded-proto') === 'https' || str_contains($request->getHttpHost(), 'vercel.app')) ? 'https' : $request->getScheme();
        $baseUrl = $scheme . '://' . $request->getHttpHost() . '/api';

        $guestColumns = [
            'id', 'name', 'category', 'identity_type', 'institution', 'purpose',
            'destination_division', 'destination_floor', 'card_number', 'submitted_at',
            'status', 'check_in_at', 'check_out_at', 'updated_at',
            DB::raw("CASE WHEN guest_photo IS NOT NULL AND guest_photo != '' THEN 1 ELSE 0 END as has_guest_photo"),
            DB::raw("CASE WHEN identity_photo IS NOT NULL AND identity_photo != '' THEN 1 ELSE 0 END as has_identity_photo"),
        ];

        $securityColumns = [
            'id', 'security_id', 'area_id', 'status', 'description', 'notes', 'checked_at',
            DB::raw("CASE WHEN photo IS NOT NULL AND photo != '' THEN 1 ELSE 0 END as has_photo"),
        ];

        switch ($type) {
            case 'today_guests':
                $items = Guest::select($guestColumns)
                    ->whereDate('submitted_at', $today)
                    ->latest('submitted_at')
                    ->get();
                $title = 'Tamu Hari Ini';
                $subtitle = 'Registrasi kunjungan seluruh tamu dan magang hari ini (' . $today->translatedFormat('d F Y') . ')';
                $category = 'guest';
                $linkTo = '/guests?date=' . $today->format('Y-m-d');
                break;

            case 'magang':
                $items = Guest::select($guestColumns)
                    ->where('category', 'magang')
                    ->where('submitted_at', '>=', $startOfMonth)
                    ->latest('submitted_at')
                    ->get();
                $title = 'Anak Magang / PKL Bulan Ini';
                $subtitle = 'Daftar seluruh peserta magang dan PKL yang aktif pada bulan ini';
                $category = 'guest';
                $linkTo = '/guests?category=magang';
                break;

            case 'month_guests':
                $items = Guest::select($guestColumns)
                    ->where('submitted_at', '>=', $startOfMonth)
                    ->latest('submitted_at')
                    ->get();
                $title = 'Tamu Bulan Ini';
                $subtitle = 'Akumulasi seluruh pengunjung terdaftar pada bulan ' . Carbon::now()->translatedFormat('F Y');
                $category = 'guest';
                $linkTo = '/guests?period=this_month';
                break;

            case 'currently_in':
                $items = Guest::select($guestColumns)
                    ->where('status', 'Sedang Berkunjung')
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
                $items = SecurityLog::with(['security:id,name', 'area:id,name,floor,building_id', 'area.building:id,name'])
                    ->select($securityColumns)
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
                    ->map(function ($area) use ($today, $baseUrl) {
                        $latestLog = SecurityLog::with('security:id,name')
                            ->select([
                                'id', 'security_id', 'area_id', 'status', 'description', 'notes', 'checked_at',
                                DB::raw("CASE WHEN photo IS NOT NULL AND photo != '' THEN 1 ELSE 0 END as has_photo")
                            ])
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
                            'photo_url' => $latestLog?->has_photo ? "$baseUrl/security-logs/{$latestLog->id}/photo" : null,
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
                $items = SecurityLog::with(['security:id,name', 'area:id,name,floor,building_id', 'area.building:id,name'])
                    ->select($securityColumns)
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
                $items = SecurityLog::with(['security:id,name', 'area:id,name,floor,building_id', 'area.building:id,name'])
                    ->select($securityColumns)
                    ->where('status', 'Perlu Perhatian')
                    ->latest('checked_at')
                    ->get();
                $title = 'Inspeksi Perlu Perhatian';
                $subtitle = 'Temuan patroli yang memerlukan atensi atau perbaikan fasilitas';
                $category = 'security';
                $linkTo = '/security-book?status=Perlu Perhatian';
                break;

            case 'insiden':
                $items = SecurityLog::with(['security:id,name', 'area:id,name,floor,building_id', 'area.building:id,name'])
                    ->select($securityColumns)
                    ->where('status', 'Insiden')
                    ->latest('checked_at')
                    ->get();
                $title = 'Insiden Keamanan Gedung';
                $subtitle = 'Laporan insiden abnormal yang membutuhkan penanganan darurat/khusus';
                $category = 'security';
                $linkTo = '/security-book?status=Insiden';
                break;

            case 'floor_11':
                $items = Guest::select($guestColumns)
                    ->where('destination_floor', 'LIKE', '%11%')
                    ->latest('submitted_at')
                    ->get();
                $title = 'Monitoring Tamu Lantai 11';
                $subtitle = 'Rincian seluruh tamu yang berkunjung ke Lantai 11 (Security Meja Resepsionis & Operasional)';
                $category = 'guest';
                $linkTo = '/guests?floor=Lantai 11';
                break;

            case 'floor_15':
                $items = Guest::select($guestColumns)
                    ->where('destination_floor', 'LIKE', '%15%')
                    ->latest('submitted_at')
                    ->get();
                $title = 'Monitoring Tamu Lantai 15';
                $subtitle = 'Rincian tamu eksekutif, mitra VVIP, dan agenda rapat di Lantai 15 (Executive Boardroom & Direksi)';
                $category = 'guest';
                $linkTo = '/guests?floor=Lantai 15';
                break;

            case 'floor_16':
                $items = Guest::select($guestColumns)
                    ->where('destination_floor', 'LIKE', '%16%')
                    ->latest('submitted_at')
                    ->get();
                $title = 'Monitoring Tamu Lantai 16 (Rooftop)';
                $subtitle = 'Rincian teknisi vendor genset, chiller, fasilitas teknik di Lantai 16 (Rooftop & Helipad)';
                $category = 'guest';
                $linkTo = '/guests?floor=Lantai 16 (Rooftop)';
                break;

            case 'floor':
                $targetFloor = $request->input('floor', 'Lantai 11');
                $items = Guest::select($guestColumns)
                    ->where(function ($q) use ($targetFloor) {
                        $q->where('destination_floor', $targetFloor)
                          ->orWhere('destination_floor', 'LIKE', "%{$targetFloor}%");
                    })
                    ->latest('submitted_at')
                    ->get();
                $title = "Monitoring Tamu: {$targetFloor}";
                $subtitle = "Rincian seluruh pengunjung dan tamu yang tercatat berkunjung ke {$targetFloor}";
                $category = 'guest';
                $linkTo = '/guests?floor=' . urlencode($targetFloor);
                break;

            case 'direksi':
                $items = Guest::select($guestColumns)
                    ->where(function ($q) {
                        $q->where('destination_division', 'LIKE', '%Direkt%')
                          ->orWhere('destination_division', 'LIKE', '%Direksi%')
                          ->orWhere('meeting_with', 'LIKE', '%Direkt%');
                    })
                    ->latest('submitted_at')
                    ->get();
                $title = 'Monitoring Kunjungan Jajaran Direksi';
                $subtitle = 'Rincian seluruh tamu audiensi pimpinan dan rapat bersama Jajaran Direktur (5 Direksi)';
                $category = 'guest';
                $linkTo = '/guests?search=Direktur';
                break;

            case 'division':
                $targetDiv = $request->input('division', 'Divisi Pengadaan dan Umum');
                $items = Guest::select($guestColumns)
                    ->where(function ($q) use ($targetDiv) {
                        $q->where('destination_division', $targetDiv)
                          ->orWhere('destination_division', 'LIKE', "%{$targetDiv}%");

                        // Keyword match for legacy data
                        if (str_contains($targetDiv, 'Transformasi Digital')) {
                            $q->orWhere('destination_division', 'LIKE', '%IT%');
                        } elseif (str_contains($targetDiv, 'Keuangan')) {
                            $q->orWhere('destination_division', 'LIKE', '%Keuangan%');
                        } elseif (str_contains($targetDiv, 'Hukum')) {
                            $q->orWhere('destination_division', 'LIKE', '%Legal%');
                        } elseif (str_contains($targetDiv, 'Operasional SDM')) {
                            $q->orWhere('destination_division', 'LIKE', '%Human Capital%');
                        } elseif (str_contains($targetDiv, 'Direktur')) {
                            $short = str_replace('Direktur ', '', $targetDiv);
                            $q->orWhere('meeting_with', 'LIKE', "%{$short}%")
                              ->orWhere('destination_division', 'LIKE', "%{$short}%");
                        }
                    })
                    ->latest('submitted_at')
                    ->get();
                $title = "Monitoring Tamu: {$targetDiv}";
                $subtitle = "Rincian seluruh tamu yang memiliki agenda kunjungan ke {$targetDiv}";
                $category = 'guest';
                $linkTo = '/guests?search=' . urlencode($targetDiv);
                break;

            default:
                return response()->json(['message' => 'Tipe drilldown tidak dikenali.'], 400);
        }

        if ($category === 'guest') {
            $items->transform(function ($g) use ($baseUrl) {
                $g->guest_photo_url = $g->has_guest_photo ? "$baseUrl/guests/{$g->id}/photo" : null;
                $g->identity_photo_url = $g->has_identity_photo ? "$baseUrl/guests/{$g->id}/identity-photo" : null;
                return $g;
            });
        } elseif ($category === 'security') {
            $items->transform(function ($l) use ($baseUrl) {
                $l->photo_url = $l->has_photo ? "$baseUrl/security-logs/{$l->id}/photo" : null;
                return $l;
            });
        }

        return response()->json([
            'type' => $type,
            'title' => $title,
            'subtitle' => $subtitle,
            'category' => $category,
            'link_to' => $linkTo,
            'linkTo' => $linkTo,
            'total' => count($items),
            'items' => $items,
        ]);
    }
}
