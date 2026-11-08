<?php

namespace App\Console\Commands;

use App\Models\Instansi;
use App\Monitoring\BatchMonitorRunner;
use App\Monitoring\Monitor;
use Illuminate\Console\Command;

class CheckSingleInstansi extends Command
{
    protected $signature = 'monitor:check {instansi? : ID atau URL instansi yang akan dicek}';

    protected $description = 'Mengecek satu website instansi spesifik atau seluruh instansi bila argumen dikosongkan';

    public function handle(Monitor $monitor, BatchMonitorRunner $runner): int
    {
        $target = $this->argument('instansi');

        if ($target === null || $target === '') {
            $count = $runner->runAll(async: false);
            $this->info("Selesai mengecek {$count} website instansi.");

            return self::SUCCESS;
        }

        $instansi = is_numeric($target)
            ? Instansi::find((int) $target)
            : Instansi::where('url', $target)->first();

        if (! $instansi) {
            $this->error("Instansi dengan identitas '{$target}' tidak ditemukan.");

            return self::FAILURE;
        }

        $check = $monitor->check($instansi);
        $this->info(sprintf(
            '[%s] %s — Status: %s | HTTP: %s | Latensi: %s ms | Konten: %s (%s)',
            $instansi->nama,
            $instansi->url,
            $check->status->label(),
            $check->http_code ?? 'ERR',
            $check->response_ms ?? '—',
            $check->content_date?->format('Y-m-d') ?? 'Tidak ditemukan',
            $check->content_source?->value ?? '—'
        ));

        return self::SUCCESS;
    }
}
