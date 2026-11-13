<?php

namespace App\Http\Middleware;

use App\Enums\Status;
use App\Models\Instansi;
use App\Monitoring\FakeMonitor;
use App\Monitoring\Monitor;
use App\Monitoring\MonitoringSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $hasTable = Schema::hasTable('instansi');

        $statusCounts = [
            'aktif' => 0,
            'kurang-aktif' => 0,
            'tidak-aktif' => 0,
            'menunggu' => 0,
        ];

        $lastCheckAt = null;
        $intervalHours = MonitoringSchedule::configuredIntervalHours();
        $nextCheckAt = MonitoringSchedule::nextRunAt($intervalHours)->toIso8601String();
        $schedulerActive = MonitoringSchedule::isSchedulerActive();
        $alertItems = [];

        if ($hasTable) {
            $grouped = Instansi::query()
                ->selectRaw('status, count(*) as aggregate')
                ->groupBy('status')
                ->pluck('aggregate', 'status');

            $statusCounts = [
                'aktif' => (int) ($grouped[Status::Aktif->value] ?? 0),
                'kurang-aktif' => (int) ($grouped[Status::KurangAktif->value] ?? 0),
                'tidak-aktif' => (int) ($grouped[Status::TidakAktif->value] ?? 0),
                'menunggu' => (int) ($grouped[''] ?? $grouped[null] ?? Instansi::whereNull('status')->count()),
            ];

            $latestChecked = Instansi::query()->max('last_checked_at');
            if ($latestChecked) {
                $lastCheckAt = \Carbon\CarbonImmutable::parse($latestChecked)->toIso8601String();
            }

            if ($user) {
                $alertsQuery = Instansi::query()
                    ->where('status', Status::TidakAktif)
                    ->whereNotNull('down_since');

                if ($user->alerts_seen_at !== null) {
                    $alertsQuery->where('down_since', '>', $user->alerts_seen_at);
                }

                $alertItems = $alertsQuery
                    ->orderByDesc('down_since')
                    ->get(['id', 'nama', 'down_since'])
                    ->map(fn (Instansi $i) => [
                        'id' => (int) $i->id,
                        'nama' => $i->nama,
                        'downSince' => $i->down_since?->toIso8601String(),
                    ])
                    ->values()
                    ->all();
            }
        }

        $boundMonitor = app()->bound(Monitor::class) ? app(Monitor::class) : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ] : null,
            ],
            'schedule' => [
                'lastCheckAt' => $lastCheckAt,
                'nextCheckAt' => $nextCheckAt,
                'intervalHours' => $intervalHours,
                'schedulerActive' => $schedulerActive,
            ],
            'alerts' => [
                'count' => count($alertItems),
                'items' => $alertItems,
            ],
            'isSampleData' => $boundMonitor instanceof FakeMonitor,
            'statusCounts' => $statusCounts,
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
