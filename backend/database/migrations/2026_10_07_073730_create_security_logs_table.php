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
        Schema::create('security_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('security_id')->constrained('users');
            $table->foreignId('area_id')->constrained('areas')->cascadeOnDelete();
            $table->string('status')->index(); // Aman, Perlu Perhatian, Insiden
            $table->text('description');
            $table->string('photo'); // Path in storage
            $table->timestamp('checked_at')->useCurrent()->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_logs');
    }
};
