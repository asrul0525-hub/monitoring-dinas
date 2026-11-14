<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AlertSeenController extends Controller
{
    public function __invoke(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->update(['alerts_seen_at' => now()]);
        }

        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return back();
    }
}
