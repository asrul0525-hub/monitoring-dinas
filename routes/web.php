<?php

use App\Http\Controllers\AlertSeenController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstansiCheckController;
use App\Http\Controllers\InstansiController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
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

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
