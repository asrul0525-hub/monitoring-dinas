<?php

namespace App\Models;

use App\Enums\ContentSource;
use App\Enums\Status;
use Database\Factories\InstansiFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instansi extends Model
{
    /** @use HasFactory<InstansiFactory> */
    use HasFactory;

    public const KATEGORI_KEYS = [
        'vertikal',
        'dinas',
        'kec_kel_pkm',
        'layanan_pemerintah',
        'layanan_publik',
    ];

    public const KATEGORI_LABELS = [
        'vertikal' => 'Instansi Vertikal',
        'dinas' => 'Dinas',
        'kec_kel_pkm' => 'Kec/Kel/PKM',
        'layanan_pemerintah' => 'Layanan Pemerintah',
        'layanan_publik' => 'Layanan Publik',
    ];

    protected $table = 'instansi';

    protected $fillable = [
        'nama',
        'kategori',
        'url',
        'feed_url',
        'status',
        'last_checked_at',
        'last_content_at',
        'last_response_ms',
        'last_http_code',
        'content_source',
        'down_since',
    ];

    protected function casts(): array
    {
        return [
            'status' => Status::class,
            'content_source' => ContentSource::class,
            'last_checked_at' => 'datetime',
            'last_content_at' => 'datetime',
            'down_since' => 'datetime',
            'last_response_ms' => 'integer',
            'last_http_code' => 'integer',
        ];
    }

    public function checks(): HasMany
    {
        return $this->hasMany(Check::class, 'instansi_id');
    }

    /**
     * @return array{
     *   id: int,
     *   nama: string,
     *   url: string,
     *   feedUrl: string|null,
     *   status: string|null,
     *   lastContentAt: string|null,
     *   lastCheckedAt: string|null,
     *   lastResponseMs: int|null,
     *   lastHttpCode: int|null,
     *   contentSource: string|null,
     *   downSince: string|null
     * }
     */
    public function toRow(): array
    {
        return [
            'id' => (int) $this->id,
            'nama' => $this->nama,
            'kategori' => $this->kategori ?: 'dinas',
            'url' => $this->url,
            'feedUrl' => $this->feed_url,
            'status' => $this->status?->value,
            'lastContentAt' => $this->last_content_at?->toIso8601String(),
            'lastCheckedAt' => $this->last_checked_at?->toIso8601String(),
            'lastResponseMs' => $this->last_response_ms,
            'lastHttpCode' => $this->last_http_code,
            'contentSource' => $this->content_source?->value,
            'downSince' => $this->down_since?->toIso8601String(),
        ];
    }
}
