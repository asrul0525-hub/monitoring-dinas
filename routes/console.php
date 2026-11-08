<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('monitor:run')
    ->cron('0 2,8,14,20 * * *')
    ->timezone('Asia/Makassar')
    ->withoutOverlapping();
