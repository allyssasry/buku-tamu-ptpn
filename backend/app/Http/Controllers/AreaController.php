<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function index(Request $request)
    {
        $query = Area::with('building');

        if ($request->boolean('active_only', false)) {
            $query->where('active', true);
        }

        if ($request->filled('building_id') && $request->building_id !== 'all') {
            $query->where('building_id', $request->building_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                  ->orWhere('floor', $like, "%{$search}%")
                  ->orWhere('description', $like, "%{$search}%")
                  ->orWhereHas('building', function ($bq) use ($search, $like) {
                      $bq->where('name', $like, "%{$search}%");
                  });
            });
        }

        $areas = $query->orderBy('floor')->orderBy('name')->get();

        return response()->json($areas);
    }

    public function store(Request $request)
    {
        $request->validate([
            'building_id' => 'nullable|exists:buildings,id',
            'name' => 'required|string|max:255',
            'floor' => 'required|string|max:100',
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $area = Area::create([
            'building_id' => $request->building_id,
            'name' => $request->name,
            'floor' => $request->floor,
            'description' => $request->description,
            'active' => $request->boolean('active', true),
        ]);

        $area->load('building');

        AuditLog::log(
            $request->user()?->id,
            'CREATE_AREA',
            'AREA',
            "Penambahan area monitoring baru: {$area->name} ({$area->floor})."
        );

        return response()->json([
            'message' => 'Area monitoring berhasil ditambahkan.',
            'area' => $area,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $area = Area::findOrFail($id);

        $request->validate([
            'building_id' => 'nullable|exists:buildings,id',
            'name' => 'sometimes|required|string|max:255',
            'floor' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $area->update($request->only(['building_id', 'name', 'floor', 'description', 'active']));
        $area->load('building');

        AuditLog::log(
            $request->user()?->id,
            'UPDATE_AREA',
            'AREA',
            "Pembaruan area monitoring: {$area->name}."
        );

        return response()->json([
            'message' => 'Area monitoring berhasil diperbarui.',
            'area' => $area,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $area = Area::findOrFail($id);
        $name = $area->name;
        $area->delete();

        AuditLog::log(
            $request->user()?->id,
            'DELETE_AREA',
            'AREA',
            "Penghapusan area monitoring: {$name} (ID: {$id})."
        );

        return response()->json(['message' => 'Area monitoring berhasil dihapus.']);
    }
}
