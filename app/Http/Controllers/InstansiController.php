<?php

namespace App\Http\Controllers;

use App\Enums\Status;
use App\Http\Requests\InstansiRequest;
use App\Models\Check;
use App\Models\Instansi;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstansiController extends Controller
{
    public function index(Request $request): Response
    {
        $rawStatus = (string) $request->query('status', '');
        $statusEnum = Status::tryFrom($rawStatus);
        $q = trim((string) $request->query('q', ''));

        $query = Instansi::query();

        if ($statusEnum !== null) {
            $query->where('status', $statusEnum->value);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'like', "%{$q}%")
                    ->orWhere('url', 'like', "%{$q}%");
            });
        }

        $paginator = $query
            ->orderBy('nama')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Instansi $i) => $i->toRow());

        return Inertia::render('Instansi/Index', [
            'rows' => $paginator,
            'filters' => [
                'status' => $statusEnum?->value,
                'q' => $q,
            ],
            'openTambah' => $request->boolean('tambah'),
        ]);
    }

    public function store(InstansiRequest $request): RedirectResponse
    {
        Instansi::query()->create([
            'nama' => $request->validated('nama'),
            'kategori' => $request->validated('kategori'),
            'url' => $request->validated('url'),
            'feed_url' => $request->validated('feed_url'),
            'status' => null,
        ]);

        return redirect()->route('instansi.index')->with('status', 'Instansi berhasil ditambahkan.');
    }

    public function update(InstansiRequest $request, Instansi $instansi): RedirectResponse
    {
        $instansi->update([
            'nama' => $request->validated('nama'),
            'kategori' => $request->validated('kategori'),
            'url' => $request->validated('url'),
            'feed_url' => $request->validated('feed_url'),
        ]);

        return redirect()->route('instansi.index')->with('status', 'Data instansi berhasil diperbarui.');
    }

    public function destroy(Instansi $instansi): RedirectResponse
    {
        $instansi->delete();

        return redirect()->route('instansi.index')->with('status', 'Instansi beserta riwayatnya telah dihapus.');
    }

    public function show(Instansi $instansi): Response
    {
        $now = CarbonImmutable::now();

        $uptime7 = $this->calculateUptime($instansi->id, $now->subDays(7));
        $uptime30 = $this->calculateUptime($instansi->id, $now->subDays(30));

        $startDay = $now->subDays(29)->startOfDay();
        $dailyChecks = Check::query()
            ->where('instansi_id', $instansi->id)
            ->where('checked_at', '>=', $startDay)
            ->whereNotNull('response_ms')
            ->get(['checked_at', 'response_ms'])
            ->groupBy(fn (Check $c) => $c->checked_at->format('Y-m-d'));

        $series = [];
        for ($i = 0; $i < 30; $i++) {
            $dayKey = $startDay->addDays($i)->format('Y-m-d');
            $dayRows = $dailyChecks->get($dayKey);
            $series[] = [
                'date' => $dayKey,
                'avgMs' => $dayRows && $dayRows->isNotEmpty()
                    ? (int) round((float) $dayRows->avg('response_ms'))
                    : null,
            ];
        }

        $checksPaginator = $instansi->checks()
            ->orderByDesc('checked_at')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Check $c) => [
                'id' => (int) $c->id,
                'checkedAt' => $c->checked_at->toIso8601String(),
                'httpCode' => $c->http_code,
                'responseMs' => $c->response_ms,
                'contentDate' => $c->content_date?->toIso8601String(),
                'contentSource' => $c->content_source?->value,
                'status' => $c->status->value,
                'error' => $c->error,
            ]);

        return Inertia::render('Instansi/Show', [
            'instansi' => $instansi->toRow(),
            'uptime' => [
                'd7' => $uptime7,
                'd30' => $uptime30,
            ],
            'series' => $series,
            'checks' => $checksPaginator,
        ]);
    }

    private function calculateUptime(int $instansiId, CarbonImmutable $since): ?float
    {
        $total = Check::query()
            ->where('instansi_id', $instansiId)
            ->where('checked_at', '>=', $since)
            ->count();

        if ($total === 0) {
            return null;
        }

        $ok = Check::query()
            ->where('instansi_id', $instansiId)
            ->where('checked_at', '>=', $since)
            ->where('http_code', 200)
            ->whereNull('error')
            ->count();

        return round(($ok / $total) * 100, 1);
    }
}
