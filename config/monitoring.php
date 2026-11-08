<?php

return [
    'driver' => env('MONITOR_DRIVER', 'live'),
    'timeout' => (int) env('MONITOR_TIMEOUT', 12),
    'connect_timeout' => (int) env('MONITOR_CONNECT_TIMEOUT', 6),
    'verify_ssl' => (bool) env('MONITOR_VERIFY_SSL', false),
    'user_agent' => env(
        'MONITOR_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ),
    'concurrency' => (int) env('MONITOR_CONCURRENCY', 8),
];
