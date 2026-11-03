<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileStorageService
{
    /**
     * Store file from either UploadedFile or base64 string.
     * Returns relative path to public storage (e.g., "identities/uuid.jpg").
     */
    public static function storePhoto($fileData, string $folder = 'uploads'): ?string
    {
        if (empty($fileData)) {
            return null;
        }

        // Case 1: UploadedFile instance
        if ($fileData instanceof UploadedFile) {
            $path = $fileData->store($folder, 'public');
            return $path;
        }

        // Case 2: Base64 string
        if (is_string($fileData) && str_starts_with($fileData, 'data:image')) {
            @list($type, $data) = explode(';', $fileData);
            @list(, $data)      = explode(',', $data);

            if (!$data) {
                return null;
            }

            $decoded = base64_decode($data);
            if ($decoded === false) {
                return null;
            }

            // Determine extension
            $extension = 'jpg';
            if (str_contains($type, 'image/png')) {
                $extension = 'png';
            } elseif (str_contains($type, 'image/webp')) {
                $extension = 'webp';
            }

            $filename = Str::uuid() . '.' . $extension;
            $relativeFilePath = $folder . '/' . $filename;

            Storage::disk('public')->put($relativeFilePath, $decoded);
            return $relativeFilePath;
        }

        // Case 3: Already an existing path
        if (is_string($fileData) && !empty($fileData)) {
            return $fileData;
        }

        return null;
    }
}
