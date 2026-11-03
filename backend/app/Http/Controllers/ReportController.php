<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Guest;
use App\Models\SecurityLog;
use App\Services\FileStorageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function guests(Request $request)
    {
        $query = Guest::with(['verifiedBy', 'checkedOutBy', 'activeDeposit']);

        // Date Period Filtering
        $period = $request->input('period', 'today');
        if ($period === 'today') {
            $query->whereDate('submitted_at', Carbon::today());
        } elseif ($period === 'this_week') {
            $query->where('submitted_at', '>=', Carbon::now()->startOfWeek());
        } elseif ($period === 'this_month') {
            $query->where('submitted_at', '>=', Carbon::now()->startOfMonth());
        } elseif ($period === 'custom') {
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereBetween('submitted_at', [
                    Carbon::parse($request->start_date)->startOfDay(),
                    Carbon::parse($request->end_date)->endOfDay(),
                ]);
            }
        }

        if ($request->filled('institution') && $request->institution !== 'all') {
            $query->where('institution', $request->institution);
        }

        if ($request->filled('division') && $request->division !== 'all') {
            $query->where('destination_division', $request->division);
        }

        if ($request->filled('floor') && $request->floor !== 'all') {
            $query->where('destination_floor', $request->floor);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $allMatchingGuests = (clone $query)->orderByDesc('submitted_at')->get();

        // 1. Aggregations
        $totalVisits = $allMatchingGuests->count();
        $currentlyInCount = $allMatchingGuests->where('status', 'Sedang Berkunjung')->count();

        // By Institution
        $byInstitution = $allMatchingGuests->groupBy('institution')->map(function ($group, $inst) {
            return ['institution' => $inst, 'count' => $group->count()];
        })->sortByDesc('count')->values();

        // By Division
        $byDivision = $allMatchingGuests->groupBy('destination_division')->map(function ($group, $div) {
            return ['division' => $div, 'count' => $group->count()];
        })->sortByDesc('count')->values();

        // By Floor
        $byFloor = $allMatchingGuests->groupBy('destination_floor')->map(function ($group, $floor) {
            return ['floor' => $floor, 'count' => $group->count()];
        })->sortByDesc('count')->values();

        // By Day
        $byDay = $allMatchingGuests->groupBy(function ($g) {
            return Carbon::parse($g->submitted_at)->format('Y-m-d');
        })->map(function ($group, $date) {
            return ['date' => $date, 'count' => $group->count()];
        })->sortBy('date')->values();

        // Peak Hours (08:00 - 17:00 distribution)
        $hourlyMap = [];
        for ($h = 7; $h <= 18; $h++) {
            $label = sprintf('%02d:00 - %02d:00', $h, $h + 1);
            $hourlyMap[$label] = 0;
        }

        foreach ($allMatchingGuests as $g) {
            $hour = Carbon::parse($g->submitted_at)->hour;
            if ($hour >= 7 && $hour <= 18) {
                $label = sprintf('%02d:00 - %02d:00', $hour, $hour + 1);
                $hourlyMap[$label] = ($hourlyMap[$label] ?? 0) + 1;
            }
        }

        $peakHours = [];
        foreach ($hourlyMap as $hourSlot => $cnt) {
            $peakHours[] = ['hour' => $hourSlot, 'count' => $cnt];
        }

        // Add photo URLs
        $allMatchingGuests->transform(function ($g) {
            $g->identity_photo_url = FileStorageService::formatUrl($g->identity_photo);
            $g->guest_photo_url = FileStorageService::formatUrl($g->guest_photo);
            return $g;
        });

        return response()->json([
            'summary' => [
                'total_visits' => $totalVisits,
                'total_tamu' => $allMatchingGuests->where('category', '!=', 'magang')->count(),
                'total_magang' => $allMatchingGuests->where('category', 'magang')->count(),
                'currently_in' => $currentlyInCount,
                'unique_institutions' => $byInstitution->count(),
            ],
            'by_institution' => $byInstitution,
            'by_division' => $byDivision,
            'by_floor' => $byFloor,
            'by_day' => $byDay,
            'peak_hours' => $peakHours,
            'data' => $allMatchingGuests,
        ]);
    }

    public function security(Request $request)
    {
        $query = SecurityLog::with(['security', 'area.building']);

        $period = $request->input('period', 'today');
        if ($period === 'today') {
            $query->whereDate('checked_at', Carbon::today());
        } elseif ($period === 'this_week') {
            $query->where('checked_at', '>=', Carbon::now()->startOfWeek());
        } elseif ($period === 'this_month') {
            $query->where('checked_at', '>=', Carbon::now()->startOfMonth());
        } elseif ($period === 'custom') {
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereBetween('checked_at', [
                    Carbon::parse($request->start_date)->startOfDay(),
                    Carbon::parse($request->end_date)->endOfDay(),
                ]);
            }
        }

        if ($request->filled('security_id') && $request->security_id !== 'all') {
            $query->where('security_id', $request->security_id);
        }

        if ($request->filled('area_id') && $request->area_id !== 'all') {
            $query->where('area_id', $request->area_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $logs = (clone $query)->orderByDesc('checked_at')->get();

        $totalChecks = $logs->count();
        $amanCount = $logs->where('status', 'Aman')->count();
        $perluPerhatianCount = $logs->where('status', 'Perlu Perhatian')->count();
        $insidenCount = $logs->where('status', 'Insiden')->count();

        // Areas inspected vs uninspected in selected period
        $allAreas = Area::with('building')->where('active', true)->get();
        $inspectedAreaIds = $logs->pluck('area_id')->unique()->toArray();

        $inspectedAreas = $allAreas->filter(fn($a) => in_array($a->id, $inspectedAreaIds))->values();
        $uninspectedAreas = $allAreas->filter(fn($a) => !in_array($a->id, $inspectedAreaIds))->values();

        $logs->transform(function ($l) {
            $l->photo_url = FileStorageService::formatUrl($l->photo);
            return $l;
        });

        return response()->json([
            'summary' => [
                'total_checks' => $totalChecks,
                'status_aman' => $amanCount,
                'status_perlu_perhatian' => $perluPerhatianCount,
                'status_insiden' => $insidenCount,
                'inspected_areas_count' => $inspectedAreas->count(),
                'uninspected_areas_count' => $uninspectedAreas->count(),
            ],
            'inspected_areas' => $inspectedAreas,
            'uninspected_areas' => $uninspectedAreas,
            'data' => $logs,
        ]);
    }
}
