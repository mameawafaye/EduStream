<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->enum('source_type', ['upload', 'youtube'])->default('upload')->after('titre');
            $table->string('youtube_id', 20)->nullable()->after('source_type');
            $table->text('description')->nullable()->after('youtube_id');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn(['source_type', 'youtube_id', 'description']);
        });
    }
};
