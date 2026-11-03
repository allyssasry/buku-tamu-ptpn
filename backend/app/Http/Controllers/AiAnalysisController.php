<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\AuditLog;
use App\Models\Guest;
use App\Models\SecurityLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiAnalysisController extends Controller
{
    public function analyze(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        // 1. Fetch exact Guest Data from PostgreSQL
        $guests = Guest::whereBetween('submitted_at', [$startDate, $endDate])->get();
        $totalVisits = $guests->count();
        $totalGuests = $guests->pluck('identity_number')->unique()->count();
        $uniqueInstitutions = $guests->pluck('institution')->unique()->count();

        // Instansi terbanyak
        $institutionCounts = $guests->groupBy('institution')->map->count()->sortDesc();
        $topInstitution = $institutionCounts->keys()->first() ?? 'Tidak ada data';
        $topInstitutionCount = $institutionCounts->first() ?? 0;

        // Hari paling ramai
        $dayNames = [
            0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu',
            4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu'
        ];
        $visitsByDayOfWeek = $guests->groupBy(function ($g) {
            return Carbon::parse($g->submitted_at)->dayOfWeek;
        })->map->count()->sortDesc();

        $busiestDayIndex = $visitsByDayOfWeek->keys()->first();
        $busiestDay = $busiestDayIndex !== null ? ($dayNames[$busiestDayIndex] ?? 'Senin') : 'Belum tercatat';
        $busiestDayCount = $visitsByDayOfWeek->first() ?? 0;

        // Jam paling ramai
        $visitsByHour = $guests->groupBy(function ($g) {
            return Carbon::parse($g->submitted_at)->hour;
        })->map->count()->sortDesc();

        $busiestHour = $visitsByHour->keys()->first();
        $busiestHourLabel = $busiestHour !== null ? sprintf('%02d:00 - %02d:00', $busiestHour, $busiestHour + 1) : '09:00 - 11:00';
        $busiestHourCount = $visitsByHour->first() ?? 0;

        // Lantai paling banyak dikunjungi
        $floorCounts = $guests->groupBy('destination_floor')->map->count()->sortDesc();
        $topFloor = $floorCounts->keys()->first() ?? 'Tidak ada data';
        $topFloorCount = $floorCounts->first() ?? 0;

        // Divisi terbanyak
        $divisionCounts = $guests->groupBy('destination_division')->map->count()->sortDesc();
        $topDivision = $divisionCounts->keys()->first() ?? 'Tidak ada data';
        $topDivisionCount = $divisionCounts->first() ?? 0;

        // Daily trend list
        $dailyTrend = $guests->groupBy(function ($g) {
            return Carbon::parse($g->submitted_at)->format('Y-m-d');
        })->map(function ($group, $date) {
            return [
                'date' => $date,
                'count' => $group->count(),
            ];
        })->sortBy('date')->values();

        // 2. Fetch exact Security Data from PostgreSQL
        $securityLogs = SecurityLog::with('area')->whereBetween('checked_at', [$startDate, $endDate])->get();
        $totalSecurityChecks = $securityLogs->count();

        // Security status counts
        $statusAman = $securityLogs->where('status', 'Aman')->count();
        $statusPerluPerhatian = $securityLogs->where('status', 'Perlu Perhatian')->count();
        $statusInsiden = $securityLogs->where('status', 'Insiden')->count();

        // Area paling sering diperiksa
        $areaCheckCounts = $securityLogs->groupBy(fn($l) => $l->area?->name ?? 'Unknown')->map->count()->sortDesc();
        $topCheckedArea = $areaCheckCounts->keys()->first() ?? 'Tidak ada';
        $topCheckedAreaCount = $areaCheckCounts->first() ?? 0;

        // Area belum diperiksa
        $allActiveAreas = Area::where('active', true)->get();
        $inspectedAreaIds = $securityLogs->pluck('area_id')->unique()->toArray();
        $uninspectedAreas = $allActiveAreas->filter(fn($a) => !in_array($a->id, $inspectedAreaIds))->values();

        // Security condition summary text
        $incidentSummary = '';
        if ($statusInsiden > 0) {
            $incidentLogs = $securityLogs->where('status', 'Insiden')->pluck('description')->take(2)->join('; ');
            $incidentSummary = "Tercatat {$statusInsiden} insiden dalam periode ini ({$incidentSummary}{$incidentLogs}).";
        } else {
            $incidentSummary = "Tidak ada insiden kritis tercatat. Seluruh area dalam ambang batas toleransi operasional.";
        }

        // 3. Synthesize Grounded Natural Language Executive Summary
        $startFormatted = $startDate->translatedFormat('d F Y');
        $endFormatted = $endDate->translatedFormat('d F Y');

        $executiveSummary = "Pada periode {$startFormatted} sampai {$endFormatted} terdapat total {$totalVisits} kunjungan tamu dari {$uniqueInstitutions} instansi berbeda. "
            . ($totalVisits > 0
                ? "Kunjungan tertinggi terjadi pada hari {$busiestDay} ({$busiestDayCount} kunjungan), dengan rentang waktu terpadat pada pukul {$busiestHourLabel}. "
                  . "{$topFloor} menjadi lantai dengan destinasi kunjungan terbanyak ({$topFloorCount} kunjungan), dipimpin oleh unit {$topDivision}. "
                : "Belum terdapat aktivitas kunjungan pada rentang tanggal ini. ")
            . "Dari sisi keamanan gedung, personel security telah melaksanakan {$totalSecurityChecks} kali pengecekan area dengan rincian {$statusAman} kondisi Aman, {$statusPerluPerhatian} Perlu Perhatian, dan {$statusInsiden} Insiden.";

        // Dynamic Insights grounded strictly on PostgreSQL metrics
        $insights = [];
        if ($totalVisits > 0) {
            $insights[] = "Kunjungan tamu terkonsentrasi pada hari {$busiestDay} dengan beban sebesar " . round(($busiestDayCount / max(1, $totalVisits)) * 100, 1) . "% dari keseluruhan kunjungan pada periode ini.";
            $insights[] = "Jam kedatangan terpadat berada di rentang {$busiestHourLabel} ({$busiestHourCount} kunjungan tercatat), memerlukan kesiapan meja resepsionis dan barrier gate.";
            if ($topInstitutionCount > 1) {
                $insights[] = "Instansi '{$topInstitution}' merupakan mitra dengan frekuensi kedatangan tertinggi ({$topInstitutionCount} kali kunjungan).";
            }
            $insights[] = "Unit kerja {$topDivision} di {$topFloor} menerima densitas tamu terbesar ({$topDivisionCount} kunjungan).";
        } else {
            $insights[] = "Aktivitas kunjungan tamu pada periode ini tercatat nihil.";
        }

        if ($uninspectedAreas->count() > 0) {
            $uninspectedNames = $uninspectedAreas->pluck('name')->take(3)->join(', ');
            $insights[] = "Terdapat {$uninspectedAreas->count()} area gedung yang belum tercatat inspeksi patrolinya pada periode ini ({$uninspectedNames}).";
        } else {
            $insights[] = "Cakupan patroli security mencapai 100% dari seluruh daftar area monitoring aktif.";
        }

        if ($statusPerluPerhatian > 0 || $statusInsiden > 0) {
            $insights[] = "Tingkat perhatian keamanan berada pada " . ($statusPerluPerhatian + $statusInsiden) . " temuan lapangan yang memerlukan koordinasi teknis lanjutan.";
        }

        // Dynamic Recommendations grounded on findings
        $recommendations = [];
        if ($totalVisits > 0) {
            $recommendations[] = "Menempatkan petugas security tambahan di lobby dan pos verifikasi identitas pada hari {$busiestDay} khususnya pukul {$busiestHourLabel}.";
            $recommendations[] = "Memastikan ketersediaan kartu visitor dan slot loker penitipan identitas pada area reception lantai tujuan {$topFloor}.";
        }
        if ($uninspectedAreas->count() > 0) {
            $recommendations[] = "Menginstruksikan regu patroli security untuk segera melakukan checklist dokumentasi foto pada area yang belum diperiksa: " . $uninspectedAreas->pluck('name')->take(2)->join(', ') . ".";
        }
        if ($statusInsiden > 0) {
            $recommendations[] = "Mengevaluasi laporan kronologi insiden dan memverifikasi perbaikan sensorik atau pengamanan bersama building management.";
        } else {
            $recommendations[] = "Mempertahankan ritme patroli berkala per 2 jam pada lantai eksekutif dan ruang infrastruktur krusial.";
        }

        // Audit Log for AI Analysis
        AuditLog::log(
            $request->user()?->id,
            'AI_ANALYSIS',
            'AI',
            "Menjalankan analisis AI periode {$startFormatted} - {$endFormatted}."
        );

        return response()->json([
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'start_label' => $startFormatted,
                'end_label' => $endFormatted,
            ],
            'guest_analysis' => [
                'total_visits' => $totalVisits,
                'total_guests' => $totalGuests,
                'total_institutions' => $uniqueInstitutions,
                'top_institution' => $topInstitution,
                'top_institution_count' => $topInstitutionCount,
                'busiest_day' => $busiestDay,
                'busiest_day_count' => $busiestDayCount,
                'busiest_hour' => $busiestHourLabel,
                'busiest_hour_count' => $busiestHourCount,
                'top_floor' => $topFloor,
                'top_floor_count' => $topFloorCount,
                'top_division' => $topDivision,
                'top_division_count' => $topDivisionCount,
                'daily_trend' => $dailyTrend,
                'floor_breakdown' => $floorCounts,
                'division_breakdown' => $divisionCounts,
            ],
            'security_analysis' => [
                'total_checks' => $totalSecurityChecks,
                'top_checked_area' => $topCheckedArea,
                'top_checked_area_count' => $topCheckedAreaCount,
                'uninspected_areas_count' => $uninspectedAreas->count(),
                'uninspected_areas' => $uninspectedAreas->pluck('name'),
                'status_aman' => $statusAman,
                'status_perlu_perhatian' => $statusPerluPerhatian,
                'status_insiden' => $statusInsiden,
                'condition_summary' => $incidentSummary,
            ],
            'narrative' => [
                'summary' => $executiveSummary,
                'insights' => $insights,
                'recommendations' => $recommendations,
            ],
        ]);
    }
}
