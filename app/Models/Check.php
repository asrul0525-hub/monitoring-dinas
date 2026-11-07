<?php

namespace App\Models;

use App\Enums\ContentSource;
use App\Enums\Status;
use Database\Factories\CheckFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Check extends Model
{
    /** @use HasFactory<CheckFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'instansi_id',
        'checked_at',
        'http_code',
        'response_ms',
        'content_date',
        'content_source',
        'status',
        'error',
    ];

    protected function casts(): array
    {
        return [
            'checked_at' => 'datetime',
            'content_date' => 'datetime',
            'http_code' => 'integer',
            'response_ms' => 'integer',
            'content_source' => ContentSource::class,
            'status' => Status::class,
        ];
    }

    public function instansi(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_id');
    }
}
