<?php

namespace App\Http\Controllers;

use App\Models\Instansi;
use App\Monitoring\Monitor;
use Illuminate\Http\RedirectResponse;

class InstansiCheckController extends Controller
{
    public function checkOne(Instansi $instansi, Monitor $monitor): RedirectResponse
    {
        $monitor->check($instansi);

        return back()->with('status', "Pengecekan {$instansi->nama} selesai.");
    }

    public function checkAll(Monitor $monitor): RedirectResponse
    {
        foreach (Instansi::query()->cursor() as $instansi) {
            $monitor->check($instansi);
        }

        return back()->with('status', 'Pengecekan seluruh instansi selesai.');
    }
}
