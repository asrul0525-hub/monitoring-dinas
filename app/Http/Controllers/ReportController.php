<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Instansi;
use App\Reports\ReportQuery;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(ReportFilterRequest $request): Response
    {
        $rows = ReportQuery::summarize(
            $request->instansiIds(),
            $request->dariDate(),
            $request->sampaiDate(),
            $request->statusEnum(),
            $request->kategoriValue(),
        );

        $instansiOptions = Instansi::query()
            ->orderBy('nama')
            ->get(['id', 'nama', 'kategori'])
            ->map(fn (Instansi $i) => [
                'id' => $i->id,
                'nama' => $i->nama,
                'kategori' => $i->kategori ?: 'dinas',
            ])
            ->values()
            ->all();

        return Inertia::render('Laporan', [
            'rows' => $rows->values()->all(),
            'instansiOptions' => $instansiOptions,
            'filters' => $request->filterPayload(),
        ]);
    }
}
