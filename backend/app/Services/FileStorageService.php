<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileStorageService
{
    /**
     * Store photo and return persistent data URI or path.
     * For cloud serverless (like Vercel), Data URLs are stored directly in TiDB's LONGTEXT column.
     * We auto-compress large images to max 800px & 75% quality to keep payloads ultra-lightweight (<100KB).
     */
    public static function storePhoto($fileData, string $folder = 'uploads'): ?string
    {
        if (empty($fileData)) {
            return null;
        }

        // Case 1: UploadedFile instance
        if ($fileData instanceof UploadedFile) {
            $raw = file_get_contents($fileData->getRealPath());
            $compressed = self::compressImageRaw($raw);
            return 'data:image/jpeg;base64,' . base64_encode($compressed);
        }

        // Case 2: Base64 data URL
        if (is_string($fileData) && str_starts_with($fileData, 'data:image')) {
            @list(, $dataPart) = explode(',', $fileData, 2);
            if ($dataPart) {
                $raw = base64_decode($dataPart);
                if ($raw !== false) {
                    $compressed = self::compressImageRaw($raw);
                    return 'data:image/jpeg;base64,' . base64_encode($compressed);
                }
            }
            return $fileData;
        }

        // Case 3: Already an existing URL or path
        if (is_string($fileData) && !empty($fileData)) {
            return $fileData;
        }

        return null;
    }

    /**
     * Compress raw image bytes to max 800px dimension and 75% JPEG quality.
     */
    public static function compressImageRaw(string $raw): string
    {
        if (!extension_loaded('gd') || strlen($raw) < 100000) {
            // Already small (<100KB) or GD not available
            return $raw;
        }

        $src = @imagecreatefromstring($raw);
        if (!$src) {
            return $raw;
        }

        $width = imagesx($src);
        $height = imagesy($src);
        $maxDim = 800;

        if ($width > $maxDim || $height > $maxDim) {
            if ($width > $height) {
                $newWidth = $maxDim;
                $newHeight = (int) round(($height * $maxDim) / $width);
            } else {
                $newHeight = $maxDim;
                $newWidth = (int) round(($width * $maxDim) / $height);
            }

            $dst = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($src);
            $src = $dst;
        }

        ob_start();
        imagejpeg($src, null, 75);
        $compressed = ob_get_clean();
        imagedestroy($src);

        return $compressed ?: $raw;
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
