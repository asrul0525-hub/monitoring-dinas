<?php

namespace App\Jobs;

use App\Models\Instansi;
use App\Monitoring\Monitor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckInstansiJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 30;

    public function __construct(
        public readonly int $instansiId,
    ) {}

    public function handle(Monitor $monitor): void
    {
        $instansi = Instansi::find($this->instansiId);
        if (! $instansi) {
            return;
        }

        $monitor->check($instansi);
    }
}
