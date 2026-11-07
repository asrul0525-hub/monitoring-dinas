<?php

namespace App\Http\Controllers;

use App\Enums\Status;
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
            ->whereNotNull('status')
            ->orderByRaw('last_content_at IS NULL DESC, last_content_at ASC, id ASC')
            ->limit(5)
            ->get()
            ->map(fn (Instansi $i) => $i->toRow())
            ->values()
            ->all();

        $failedLastCycle = Instansi::query()
            ->where('status', Status::TidakAktif)
            ->count();

        return Inertia::render('Dashboard', [
            'attention' => $attention,
            'fastest' => $fastest,
            'stalest' => $stalest,
            'failedLastCycle' => $failedLastCycle,
        ]);
    }
}
