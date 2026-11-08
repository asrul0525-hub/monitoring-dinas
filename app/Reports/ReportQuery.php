<?php

namespace App\Reports;

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class ReportQuery
{
    /**
     * @param  array<int, int>  $instansiIds
     * @return Collection<int, array{
     *     instansiId: int,
     *     nama: string,
     *     kategori: string,
     *     url: string,
     *     uptimePct: ?float,
     *     downtimeCount: int,
     *     avgResponseMs: ?int,
     *     daysSinceUpdate: ?int,
     *     endStatus: ?string
     * }>
     */
    public static function summarize(
        array $instansiIds,
        CarbonInterface $dari,
        CarbonInterface $sampai,
        ?Status $status,
        ?string $kategori = null,
    ): Collection {
        $query = Instansi::query()->orderBy('nama');

        if ($instansiIds !== []) {
            $query->whereIn('id', $instansiIds);
        }

        if ($kategori !== null && in_array($kategori, ['vertikal', 'dinas', 'kec_kel_pkm'], true)) {
            $query->where('kategori', $kategori);
        }

        $instansis = $query->get();

        if ($instansis->isEmpty()) {
            return collect();
        }

        $ids = $instansis->pluck('id')->all();

        $allChecksUpToEnd = Check::query()
            ->whereIn('instansi_id', $ids)
            ->where('checked_at', '<=', $sampai)
            ->orderByDesc('checked_at')
            ->orderByDesc('id')
            ->get()
            ->groupBy('instansi_id');

        $rows = $instansis->map(function (Instansi $instansi) use ($allChecksUpToEnd, $dari, $sampai): array {
            /** @var Collection<int, Check> $checksUpToEnd */
            $checksUpToEnd = $allChecksUpToEnd->get($instansi->id, collect());

            $periodChecks = $checksUpToEnd->filter(
                fn (Check $c) => $c->checked_at !== null && $c->checked_at->greaterThanOrEqualTo($dari)
            );

            $total = $periodChecks->count();
            $ok = $periodChecks->where('http_code', 200)->count();
            $uptimePct = $total > 0 ? round(($ok / $total) * 100, 1) : null;
            $downtimeCount = $periodChecks->filter(fn (Check $c) => $c->http_code !== 200)->count();

            $withResponse = $periodChecks->whereNotNull('response_ms');
            $avgResponseMs = $withResponse->isNotEmpty()
                ? (int) round((float) $withResponse->avg('response_ms'))
                : null;

            /** @var ?Check $latestUpToEnd */
            $latestUpToEnd = $checksUpToEnd->first();
            $endStatus = $latestUpToEnd?->status?->value;

            /** @var ?Check $latestWithContent */
            $latestWithContent = $checksUpToEnd->first(fn (Check $c) => $c->content_date !== null);
            $contentDate = $latestWithContent?->content_date;

            $daysSinceUpdate = $contentDate !== null
                ? (int) max(0, CarbonImmutable::instance($contentDate)->startOfDay()->diffInDays(CarbonImmutable::instance($sampai)->startOfDay()))
                : null;

            return [
                'instansiId' => $instansi->id,
                'nama' => $instansi->nama,
                'kategori' => $instansi->kategori ?: 'dinas',
                'url' => $instansi->url,
                'uptimePct' => $uptimePct,
                'downtimeCount' => $downtimeCount,
                'avgResponseMs' => $avgResponseMs,
                'daysSinceUpdate' => $daysSinceUpdate,
                'endStatus' => $endStatus,
            ];
        });

        if ($status !== null) {
            $rows = $rows->filter(fn (array $row) => $row['endStatus'] === $status->value)->values();
        }

        return $rows->values();
    }
}
