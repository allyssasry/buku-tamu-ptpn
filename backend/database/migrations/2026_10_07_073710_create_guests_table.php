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
        Schema::create('guests', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('institution')->index();
            $table->string('position')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();

            // Visit Details
            $table->string('purpose');
            $table->string('meeting_with');
            $table->string('destination_division')->index();
            $table->string('destination_floor')->index();

            // Identity Details
            $table->string('identity_type'); // KTP, SIM, ID Card, Passport, Lainnya
            $table->string('identity_number')->nullable();
            $table->string('identity_photo'); // Path to storage
            $table->string('guest_photo')->nullable(); // Path to storage

            // Status & Timestamps
            $table->string('status')->default('Menunggu Verifikasi')->index();
            $table->boolean('consent')->default(true);
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();

            // References
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('checked_out_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guests');
    }
};
