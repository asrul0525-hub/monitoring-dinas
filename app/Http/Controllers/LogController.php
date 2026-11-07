<?php

namespace App\Http\Controllers;

use App\Models\Check;
use App\Models\Instansi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $instansiFilter = $request->query('instansi');
        $instansiId = is_numeric($instansiFilter) ? (int) $instansiFilter : null;

        $hasilFilter = $request->query('hasil');
        $hasil = in_array($hasilFilter, ['sukses', 'gagal'], true) ? $hasilFilter : null;

        $query = Check::query()
            ->with('instansi:id,nama')
            ->orderByDesc('checked_at')
            ->orderByDesc('id');

        if ($instansiId !== null) {
            $query->where('instansi_id', $instansiId);
        }

        if ($hasil === 'sukses') {
            $query->where('http_code', 200);
        } elseif ($hasil === 'gagal') {
            $query->where(function ($q) {
                $q->whereNull('http_code')
                    ->orWhere('http_code', '!=', 200);
            });
        }

        $paginated = $query->paginate(50)->withQueryString()->through(fn (Check $check) => [
            'id' => $check->id,
            'checkedAt' => $check->checked_at?->toIso8601String(),
            'instansi' => [
                'id' => $check->instansi?->id ?? $check->instansi_id,
                'nama' => $check->instansi?->nama ?? '—',
            ],
            'httpCode' => $check->http_code,
            'responseMs' => $check->response_ms,
            'status' => $check->status?->value,
            'error' => $check->error,
        ]);

        $instansiOptions = Instansi::query()
            ->orderBy('nama')
            ->get(['id', 'nama'])
            ->map(fn (Instansi $i) => [
                'id' => $i->id,
                'nama' => $i->nama,
            ])
            ->values()
            ->all();

        return Inertia::render('Log', [
            'rows' => $paginated,
            'instansiOptions' => $instansiOptions,
            'filters' => [
                'instansi' => $instansiId,
                'hasil' => $hasil,
            ],
        ]);
    }
}
