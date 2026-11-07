<?php

namespace Database\Factories;

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Check>
 */
class CheckFactory extends Factory
{
    protected $model = Check::class;

    public function definition(): array
    {
        return [
            'instansi_id' => Instansi::factory(),
            'checked_at' => now()->subHour(),
            'http_code' => 200,
            'response_ms' => 240,
            'content_date' => now()->subDays(2),
            'content_source' => ContentSource::Sitemap,
            'status' => Status::Aktif,
            'error' => null,
        ];
    }
}
