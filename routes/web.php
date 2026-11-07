<?php

use App\Http\Controllers\AlertSeenController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstansiCheckController;
use App\Http\Controllers\InstansiController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\MonitorSettingsController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportExportController;
use Illuminate\Support\Facades\Route;

Route::get('/', DashboardController::class)->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::resource('instansi', InstansiController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
        'show',
    ]);

    Route::post('/instansi/{instansi}/cek', [InstansiCheckController::class, 'checkOne'])->name('instansi.cek');
    Route::post('/cek-semua', [InstansiCheckController::class, 'checkAll'])->name('cek.semua');
    Route::post('/notifikasi/dibaca', AlertSeenController::class)->name('notifikasi.dibaca');
    Route::get('/laporan', ReportController::class)->name('laporan.index');
    Route::get('/laporan/export/pdf', [ReportExportController::class, 'pdf'])->name('laporan.export.pdf');
    Route::get('/laporan/export/excel', [ReportExportController::class, 'excel'])->name('laporan.export.excel');
    Route::get('/log', LogController::class)->name('log.index');
    Route::get('/pengaturan', [MonitorSettingsController::class, 'index'])->name('pengaturan.index');
    Route::put('/pengaturan/monitor', [MonitorSettingsController::class, 'update'])->name('pengaturan.monitor.update');
});

require __DIR__.'/auth.php';
