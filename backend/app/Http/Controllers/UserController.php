<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                  ->orWhere('email', $like, "%{$search}%")
                  ->orWhere('phone', $like, "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->paginate($request->input('per_page', 20));

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:admin,security,pimpinan,tamu',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        AuditLog::log(
            $request->user()?->id,
            'CREATE_USER',
            'USER_MGMT',
            "Pembuatan user baru: {$user->name} ({$user->role}) - {$user->email}."
        );

        return response()->json([
            'message' => 'User berhasil dibuat.',
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'role' => 'sometimes|required|in:admin,security,pimpinan,tamu',
            'phone' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
        ]);

        $data = $request->only(['name', 'email', 'role', 'phone']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        AuditLog::log(
            $request->user()?->id,
            'UPDATE_USER',
            'USER_MGMT',
            "Pembaruan user ID {$user->id} ({$user->name})."
        );

        return response()->json([
            'message' => 'Data user berhasil diperbarui.',
            'user' => $user,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 422);
        }

        $name = $user->name;
        $user->delete();

        AuditLog::log(
            $request->user()?->id,
            'DELETE_USER',
            'USER_MGMT',
            "Penghapusan user: {$name} (ID: {$id})."
        );

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
