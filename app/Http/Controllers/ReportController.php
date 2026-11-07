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
        );

        $instansiOptions = Instansi::query()
            ->orderBy('nama')
            ->get(['id', 'nama'])
            ->map(fn (Instansi $i) => [
                'id' => $i->id,
                'nama' => $i->nama,
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
