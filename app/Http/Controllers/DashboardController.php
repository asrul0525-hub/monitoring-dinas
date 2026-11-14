<?php

namespace App\Http\Controllers;

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $downItems = Instansi::query()
            ->where('status', Status::TidakAktif)
            ->orderByRaw('down_since IS NULL ASC, down_since ASC, id ASC')
            ->limit(10)
            ->get();

        $remaining = max(0, 10 - $downItems->count());

        $staleItems = $remaining > 0
            ? Instansi::query()
                ->where('status', Status::KurangAktif)
                ->orderByRaw('last_content_at IS NULL ASC, last_content_at ASC, id ASC')
                ->limit($remaining)
                ->get()
            : collect();

        $attention = $downItems
            ->concat($staleItems)
            ->map(fn (Instansi $i) => $i->toRow())
            ->values()
            ->all();

        $attentionStale = Instansi::query()
            ->where('status', Status::KurangAktif)
            ->orderByRaw('last_content_at IS NULL ASC, last_content_at ASC, id ASC')
            ->limit(6)
            ->get()
            ->map(fn (Instansi $i) => $i->toRow())
            ->values()
            ->all();

        $attentionReasons = [];
        $downIds = $downItems->pluck('id')->all();
        if ($downIds !== []) {
            $latestCheckIds = Check::query()
                ->whereIn('instansi_id', $downIds)
                ->selectRaw('MAX(id) as latest_id')
                ->groupBy('instansi_id')
                ->pluck('latest_id');
            if ($latestCheckIds->isNotEmpty()) {
                $attentionReasons = Check::query()
                    ->whereIn('id', $latestCheckIds)
                    ->whereNotNull('error')
                    ->pluck('error', 'instansi_id')
                    ->all();
            }
        }

        $fastest = Instansi::query()
            ->whereIn('status', [Status::Aktif->value, Status::KurangAktif->value])
            ->whereNotNull('last_response_ms')
            ->orderBy('last_response_ms')
            ->orderBy('id')
            ->limit(5)
            ->get()
            ->map(fn (Instansi $i) => $i->toRow())
            ->values()
            ->all();

        $stalest = Instansi::query()
            ->whereIn('status', [Status::KurangAktif->value, Status::Aktif->value])
            ->whereNotNull('last_content_at')
            ->orderBy('last_content_at', 'asc')
            ->orderBy('id', 'asc')
            ->limit(5)
            ->get()
            ->map(fn (Instansi $i) => $i->toRow())
            ->values()
            ->all();

        $failedLastCycle = Instansi::query()
            ->where('status', Status::TidakAktif)
            ->count();

        $checkedCount = Instansi::query()->whereNotNull('status')->count();
        $onlineCount = Instansi::query()
            ->whereIn('status', [Status::Aktif->value, Status::KurangAktif->value])
            ->count();
        $uptimePct = $checkedCount > 0 ? round(($onlineCount / $checkedCount) * 100, 1) : null;

        $avgResponseRaw = Instansi::query()
            ->whereIn('status', [Status::Aktif->value, Status::KurangAktif->value])
            ->whereNotNull('last_response_ms')
            ->avg('last_response_ms');
        $avgResponseMs = $avgResponseRaw !== null ? (int) round((float) $avgResponseRaw) : null;

        $allInstansi = Instansi::query()->get(['kategori', 'status']);
        $kategoriKeys = Instansi::KATEGORI_KEYS;
        $kategoriBreakdown = [];
        foreach ($kategoriKeys as $kat) {
            $group = $allInstansi->filter(fn (Instansi $i) => ($i->kategori ?: 'dinas') === $kat);
            $kategoriBreakdown[] = [
                'kategori' => $kat,
                'total' => $group->count(),
                'aktif' => $group->filter(fn (Instansi $i) => $i->status === Status::Aktif)->count(),
                'kurang' => $group->filter(fn (Instansi $i) => $i->status === Status::KurangAktif)->count(),
                'tidak' => $group->filter(fn (Instansi $i) => $i->status === Status::TidakAktif)->count(),
            ];
        }

        return Inertia::render('Dashboard', [
            'attention' => $attention,
            'attentionStale' => $attentionStale,
            'attentionReasons' => $attentionReasons,
            'fastest' => $fastest,
            'stalest' => $stalest,
            'failedLastCycle' => $failedLastCycle,
            'kpi' => [
                'uptimePct' => $uptimePct,
                'avgResponseMs' => $avgResponseMs,
                'downCount' => $failedLastCycle,
            ],
            'kategoriBreakdown' => $kategoriBreakdown,
        ]);
    }
}
