<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Monitoring\MonitoringSchedule;
use App\Monitoring\RecalculateStatuses;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MonitorSettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Pengaturan', [
            'settings' => [
                'freshnessDays' => (int) Setting::get('freshness_days', 30),
                'checkIntervalHours' => MonitoringSchedule::configuredIntervalHours(),
                'schedulerActive' => MonitoringSchedule::isSchedulerActive(),
                'lastHeartbeatAt' => MonitoringSchedule::lastHeartbeatAt(),
            ],
        ]);
    }

    public function update(Request $request, RecalculateStatuses $recalculate): RedirectResponse
    {
        $validated = $request->validate([
            'freshness_days' => ['required', 'integer', 'min:1', 'max:365'],
            'check_interval_hours' => ['nullable', 'integer', Rule::in(MonitoringSchedule::ALLOWED_INTERVALS)],
        ], [
            'freshness_days.required' => 'Ambang hari keaktifan konten wajib diisi.',
            'freshness_days.integer' => 'Ambang hari harus berupa angka bulat.',
            'freshness_days.min' => 'Ambang hari minimal 1 hari.',
            'freshness_days.max' => 'Ambang hari maksimal 365 hari.',
            'check_interval_hours.integer' => 'Interval pengecekan harus berupa angka bulat.',
            'check_interval_hours.in' => 'Interval pengecekan hanya mendukung 1, 3, 6, atau 12 jam.',
        ]);

        Setting::put('freshness_days', (int) $validated['freshness_days']);
        if (isset($validated['check_interval_hours'])) {
            Setting::put('check_interval_hours', (int) $validated['check_interval_hours']);
        }
        $recalculate();

        return back()->with('status', 'Pengaturan monitoring disimpan dan seluruh status telah dihitung ulang.');
    }
}
