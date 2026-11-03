<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileStorageService
{
    /**
     * Store photo and return persistent data URI or path.
     * For cloud serverless (like Vercel), Data URLs are stored directly in TiDB's LONGTEXT column,
     * ensuring photos never disappear and load with zero external file dependencies.
     */
    public static function storePhoto($fileData, string $folder = 'uploads'): ?string
    {
        if (empty($fileData)) {
            return null;
        }

        // Case 1: UploadedFile instance
        if ($fileData instanceof UploadedFile) {
            $data = file_get_contents($fileData->getRealPath());
            $mime = $fileData->getMimeType() ?: 'image/jpeg';
            return 'data:' . $mime . ';base64,' . base64_encode($data);
        }

        // Case 2: Base64 data URL
        if (is_string($fileData) && str_starts_with($fileData, 'data:image')) {
            return $fileData;
        }

        // Case 3: Already an existing URL or path
        if (is_string($fileData) && !empty($fileData)) {
            return $fileData;
        }

        return null;
    }

    /**
     * Convert stored photo path or data URL to browser-ready URL.
     */
    public static function formatUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'data:image') || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset('storage/' . $path);
    }
}
