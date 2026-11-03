<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->nullable();
            $table->string('address')->nullable();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->foreignId('building_id')->nullable()->after('id')->constrained('buildings')->nullOnDelete();
        });

        // Insert default initial buildings
        $now = now();
        $defaultBuildingId = DB::table('buildings')->insertGetId([
            'name' => 'Graha Nusa Tiga',
            'code' => 'GNT',
            'address' => 'Kantor Pusat Holding Graha Nusa Tiga',
            'description' => 'Gedung Graha Nusa Tiga - operasional direksi & holding',
            'active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('buildings')->insert([
            'name' => 'Agro Plaza',
            'code' => 'AGRO',
            'address' => 'Gedung Agro Plaza, Setiabudi, Jakarta Selatan',
            'description' => 'Gedung perkantoran Agro Plaza',
            'active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Connect existing areas to default building
        DB::table('areas')->whereNull('building_id')->update([
            'building_id' => $defaultBuildingId,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('areas', function (Blueprint $table) {
            $table->dropForeign(['building_id']);
            $table->dropColumn('building_id');
        });

        Schema::dropIfExists('buildings');
    }
};

