<?php

use App\Http\Controllers\AiAnalysisController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\IdentityDepositController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SecurityLogController;
use App\Http\Controllers\UserController;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Endpoints
Route::post('/login', [AuthController::class, 'login']);
Route::post('/guests', [GuestController::class, 'store']); // Public guest registration form
Route::get('/areas', [AreaController::class, 'index']); // Public so guest form can load available floors
Route::get('/buildings', [BuildingController::class, 'index']); // Public list of buildings
Route::get('/active-cards', [GuestController::class, 'activeCards']); // Public list of currently occupied access cards

// Protected Endpoints via Sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Guests Management & Verification
    Route::get('/guests', [GuestController::class, 'index']);
    Route::get('/guests/{id}', [GuestController::class, 'show']);
    Route::put('/guests/{id}', [GuestController::class, 'update']);
    Route::delete('/guests/{id}', [GuestController::class, 'destroy']);
    Route::post('/guests/{id}/verify', [GuestController::class, 'verify']);
    Route::post('/guests/{id}/checkin', [GuestController::class, 'checkin']);
    Route::post('/guests/{id}/checkout', [GuestController::class, 'checkout']);

    // Identity Deposit
    Route::get('/identity-deposits', [IdentityDepositController::class, 'index']);
    Route::post('/identity-deposits', [IdentityDepositController::class, 'store']);
    Route::post('/identity-deposits/{id}/return', [IdentityDepositController::class, 'returnDeposit']);

    // Security Book (Area Monitoring)
    Route::get('/security-logs', [SecurityLogController::class, 'index']);
    Route::post('/security-logs', [SecurityLogController::class, 'store']);
    Route::get('/security-logs/{id}', [SecurityLogController::class, 'show']);

    // Areas
    Route::post('/areas', [AreaController::class, 'store']);
    Route::put('/areas/{id}', [AreaController::class, 'update']);
    Route::delete('/areas/{id}', [AreaController::class, 'destroy']);

    // Buildings (Master Data Gedung)
    Route::post('/buildings', [BuildingController::class, 'store']);
    Route::get('/buildings/{id}', [BuildingController::class, 'show']);
    Route::put('/buildings/{id}', [BuildingController::class, 'update']);
    Route::delete('/buildings/{id}', [BuildingController::class, 'destroy']);

    // Users Management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/drilldown', [DashboardController::class, 'drilldown']);

    // Reports
    Route::get('/reports/guests', [ReportController::class, 'guests']);
    Route::get('/reports/security', [ReportController::class, 'security']);

    // AI Analysis
    Route::post('/ai/analyze', [AiAnalysisController::class, 'analyze']);

    // Audit Logs
    Route::get('/audit-logs', function (Request $request) {
        $logs = AuditLog::with('user')->latest('created_at')->paginate($request->input('per_page', 25));
        return response()->json($logs);
    });
});
