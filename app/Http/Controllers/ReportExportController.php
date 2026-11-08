<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Http\Requests\ReportFilterRequest;
use App\Reports\ReportQuery;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportExportController extends Controller
{
    public function excel(ReportFilterRequest $request): BinaryFileResponse
    {
        $rows = ReportQuery::summarize(
            $request->instansiIds(),
            $request->dariDate(),
            $request->sampaiDate(),
            $request->statusEnum(),
            $request->kategoriValue(),
        );

        $filters = $request->filterPayload();
        $filename = "laporan-monitoring-{$filters['dari']}_{$filters['sampai']}.xlsx";

        return Excel::download(new ReportExport($rows), $filename);
    }

    public function pdf(ReportFilterRequest $request): Response
    {
        $rows = ReportQuery::summarize(
            $request->instansiIds(),
            $request->dariDate(),
            $request->sampaiDate(),
            $request->statusEnum(),
            $request->kategoriValue(),
        );

        $filters = $request->filterPayload();
        $filename = "laporan-monitoring-{$filters['dari']}_{$filters['sampai']}.pdf";

        $pdf = Pdf::loadView('reports.pdf', [
            'rows' => $rows,
            'filters' => $filters,
            'printedAt' => now('Asia/Makassar')->format('d M Y H:i').' WITA',
        ])->setPaper('a4', 'landscape');

        return $pdf->download($filename);
    }
}
