<?php

use App\Monitoring\MonitoringSchedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    MonitoringSchedule::recordHeartbeat();
})
    ->name('radar:scheduler-heartbeat')
    ->everyMinute();

Schedule::command('monitor:run')
    ->cron(MonitoringSchedule::cronExpressionForInterval(MonitoringSchedule::configuredIntervalHours()))
    ->timezone(MonitoringSchedule::TIMEZONE)
    ->withoutOverlapping();
