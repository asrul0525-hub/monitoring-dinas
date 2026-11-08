<?php

namespace App\Providers;

use App\Monitoring\FakeMonitor;
use App\Monitoring\LiveMonitor;
use App\Monitoring\Monitor;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(Monitor::class, function ($app) {
            $driver = config('monitoring.driver', 'live');

            return $driver === 'fake'
                ? $app->make(FakeMonitor::class)
                : $app->make(LiveMonitor::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
