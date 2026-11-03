<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Building;
use Illuminate\Http\Request;

class BuildingController extends Controller
{
    public function index(Request $request)
    {
        $query = Building::withCount('areas');

        if ($request->boolean('active_only', false)) {
            $query->where('active', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%")
                  ->orWhere('address', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $buildings = $query->orderBy('name')->get();

        return response()->json($buildings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:buildings,name',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $building = Building::create([
            'name' => $request->name,
            'code' => $request->code,
            'address' => $request->address,
            'description' => $request->description,
            'active' => $request->boolean('active', true),
        ]);

        AuditLog::log(
            $request->user()?->id,
            'CREATE_BUILDING',
            'BUILDING',
            "Penambahan gedung baru: {$building->name} ({$building->code})."
        );

        return response()->json([
            'message' => 'Data gedung berhasil ditambahkan.',
            'building' => $building,
        ], 201);
    }

    public function show($id)
    {
        $building = Building::with(['areas' => function ($q) {
            $q->orderBy('floor')->orderBy('name');
        }])->findOrFail($id);

        return response()->json($building);
    }

    public function update(Request $request, $id)
    {
        $building = Building::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:buildings,name,' . $id,
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $building->update($request->only(['name', 'code', 'address', 'description', 'active']));

        AuditLog::log(
            $request->user()?->id,
            'UPDATE_BUILDING',
            'BUILDING',
            "Pembaruan data gedung: {$building->name}."
        );

        return response()->json([
            'message' => 'Data gedung berhasil diperbarui.',
            'building' => $building,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $building = Building::findOrFail($id);
        $name = $building->name;
        $building->delete();

        AuditLog::log(
            $request->user()?->id,
            'DELETE_BUILDING',
            'BUILDING',
            "Penghapusan gedung: {$name} (ID: {$id})."
        );

        return response()->json(['message' => 'Data gedung berhasil dihapus.']);
    }
}

