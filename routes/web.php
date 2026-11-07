<?php

use App\Http\Controllers\AlertSeenController;
use App\Http\Controllers\InstansiCheckController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::post('/instansi/{instansi}/cek', [InstansiCheckController::class, 'checkOne'])->name('instansi.cek');
    Route::post('/cek-semua', [InstansiCheckController::class, 'checkAll'])->name('cek.semua');
    Route::post('/notifikasi/dibaca', AlertSeenController::class)->name('notifikasi.dibaca');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
