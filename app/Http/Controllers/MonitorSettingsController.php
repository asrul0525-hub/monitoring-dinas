<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Monitoring\RecalculateStatuses;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonitorSettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Pengaturan', [
            'settings' => [
                'freshnessDays' => (int) Setting::get('freshness_days', 30),
                'checkIntervalHours' => (int) Setting::get('check_interval_hours', 6),
            ],
        ]);
    }

    public function update(Request $request, RecalculateStatuses $recalculate): RedirectResponse
    {
        $validated = $request->validate([
            'freshness_days' => ['required', 'integer', 'min:1', 'max:365'],
        ], [
            'freshness_days.required' => 'Ambang hari keaktifan konten wajib diisi.',
            'freshness_days.integer' => 'Ambang hari harus berupa angka bulat.',
            'freshness_days.min' => 'Ambang hari minimal 1 hari.',
            'freshness_days.max' => 'Ambang hari maksimal 365 hari.',
        ]);

        Setting::put('freshness_days', (int) $validated['freshness_days']);
        $recalculate();

        return back()->with('status', 'Ambang keaktifan konten disimpan dan seluruh status telah dihitung ulang.');
    }
}
