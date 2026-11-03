<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/debug-route', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'uri' => $request->getRequestUri(),
        'path' => $request->path(),
        'server_request_uri' => $_SERVER['REQUEST_URI'] ?? null,
        'server_script_name' => $_SERVER['SCRIPT_NAME'] ?? null,
    ]);
});

Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    if (!file_exists($fullPath)) {
        $fullPath = public_path('storage/' . $path);
    }
    if (file_exists($fullPath)) {
        $mime = mime_content_type($fullPath) ?: 'application/octet-stream';
        return response(file_get_contents($fullPath), 200, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
    abort(404);
})->where('path', '.*');
