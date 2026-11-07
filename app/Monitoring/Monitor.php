<?php

namespace App\Monitoring;

use App\Models\Check;
use App\Models\Instansi;
use Carbon\CarbonInterface;

interface Monitor
{
    public function check(Instansi $instansi, ?CarbonInterface $at = null): Check;
}
