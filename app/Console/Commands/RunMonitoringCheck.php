<?php

namespace App\Console\Commands;

use App\Models\Instansi;
use App\Monitoring\BatchMonitorRunner;
use Illuminate\Console\Command;

class RunMonitoringCheck extends Command
{
    protected $signature = 'monitor:run {--queue : Kirim pengecekan ke antrean background}';

    protected $description = 'Menjalankan siklus pemantauan seluruh website instansi daerah (Diskominfo HSU)';

    public function handle(BatchMonitorRunner $runner): int
    {
        $total = Instansi::count();
        if ($total === 0) {
            $this->info('Belum ada instansi yang terdaftar untuk dipantau.');

            return self::SUCCESS;
        }

        $async = (bool) $this->option('queue');
        if ($async) {
            $count = $runner->runAll(async: true);
            $this->info("Berhasil mengirim {$count} pekerjaan pengecekan instansi ke antrean.");

            return self::SUCCESS;
        }

        $this->info("Memulai pengecekan {$total} website instansi...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $checked = $runner->runAll(
            async: false,
            onProgress: fn () => $bar->advance()
        );

        $bar->finish();
        $this->newLine(2);
        $this->info("Selesai mengecek {$checked} website instansi.");

        return self::SUCCESS;
    }
}
