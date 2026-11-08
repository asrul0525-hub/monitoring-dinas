<?php

return [
    'driver' => env('MONITOR_DRIVER', 'live'),
    'timeout' => (int) env('MONITOR_TIMEOUT', 10),
    'connect_timeout' => (int) env('MONITOR_CONNECT_TIMEOUT', 5),
    'verify_ssl' => (bool) env('MONITOR_VERIFY_SSL', false),
    'user_agent' => env('MONITOR_USER_AGENT', 'Diskominfo-HSU-Monitor/1.0 (+https://diskominfo.hsu.go.id)'),
    'concurrency' => (int) env('MONITOR_CONCURRENCY', 8),
];
