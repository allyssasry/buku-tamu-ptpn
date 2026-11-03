<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        // Create Sanctum Token
        $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

        AuditLog::log($user->id, 'LOGIN', 'AUTH', "Pengguna {$user->name} ({$user->role}) berhasil masuk ke sistem.");

        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            AuditLog::log($user->id, 'LOGOUT', 'AUTH', "Pengguna {$user->name} keluar dari sistem.");
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Berhasil logout.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
            ],
        ]);
    }
}
