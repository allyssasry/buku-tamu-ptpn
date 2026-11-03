<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->string('category')->default('tamu')->index()->after('notes'); // 'tamu', 'magang'
            $table->string('card_number')->nullable()->index()->after('category'); // Nomor kartu fisik / ID badge
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->dropColumn(['category', 'card_number']);
        });
    }
};
