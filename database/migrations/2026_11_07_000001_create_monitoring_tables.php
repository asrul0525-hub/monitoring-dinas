<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('alerts_seen_at')->nullable();
        });

        Schema::create('instansi', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('url')->unique();
            $table->string('feed_url')->nullable();
            $table->string('status')->nullable()->index();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_content_at')->nullable();
            $table->unsignedInteger('last_response_ms')->nullable();
            $table->unsignedSmallInteger('last_http_code')->nullable();
            $table->string('content_source')->nullable();
            $table->timestamp('down_since')->nullable();
            $table->timestamps();
        });

        Schema::create('checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instansi_id')->constrained('instansi')->cascadeOnDelete();
            $table->timestamp('checked_at');
            $table->unsignedSmallInteger('http_code')->nullable();
            $table->unsignedInteger('response_ms')->nullable();
            $table->timestamp('content_date')->nullable();
            $table->string('content_source')->nullable();
            $table->string('status');
            $table->string('error')->nullable();

            $table->index(['instansi_id', 'checked_at']);
            $table->index('checked_at');
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->json('value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('checks');
        Schema::dropIfExists('instansi');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('alerts_seen_at');
        });
    }
};
