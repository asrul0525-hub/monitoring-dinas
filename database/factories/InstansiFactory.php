<?php

namespace Database\Factories;

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Instansi;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Instansi>
 */
class InstansiFactory extends Factory
{
    protected $model = Instansi::class;

    public function definition(): array
    {
        $num = $this->faker->unique()->numberBetween(1, 9999);

        return [
            'nama' => sprintf('Dinas Contoh %02d', $num),
            'kategori' => 'dinas',
            'url' => sprintf('https://dinas-contoh-%02d.go.id', $num),
            'feed_url' => sprintf('https://dinas-contoh-%02d.go.id/sitemap.xml', $num),
            'status' => Status::Aktif,
            'last_checked_at' => now()->subHour(),
            'last_content_at' => now()->subDays(2),
            'last_response_ms' => 240,
            'last_http_code' => 200,
            'content_source' => ContentSource::Sitemap,
            'down_since' => null,
        ];
    }
}
