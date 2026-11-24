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
            if (!Schema::hasColumn('guests', 'work_order_number')) {
                $table->string('work_order_number')->nullable()->after('purpose');
            }
            if (!Schema::hasColumn('guests', 'items_brought_in')) {
                $table->text('items_brought_in')->nullable()->after('work_order_number');
            }
            if (!Schema::hasColumn('guests', 'items_brought_out')) {
                $table->text('items_brought_out')->nullable()->after('items_brought_in');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->dropColumn(['work_order_number', 'items_brought_in', 'items_brought_out']);
        });
    }
};
