<?php

return [
    'driver' => env('MONITOR_DRIVER', 'live'),
    'timeout' => (int) env('MONITOR_TIMEOUT', 14),
    'connect_timeout' => (int) env('MONITOR_CONNECT_TIMEOUT', 6),
    'verify_ssl' => (bool) env('MONITOR_VERIFY_SSL', false),
    'user_agent' => env(
        'MONITOR_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ),
    'concurrency' => (int) env('MONITOR_CONCURRENCY', 4),
    'retry_delay_ms' => (int) env('MONITOR_RETRY_DELAY_MS', 1500),
    'feed_cache_hours' => (int) env('MONITOR_FEED_CACHE_HOURS', 6),

    /*
    |--------------------------------------------------------------------------
    | Blacklist Keywords (Soft-200 / Closed / Suspended / Maintenance)
    |--------------------------------------------------------------------------
    |
    | Jika website mengembalikan HTTP 200 OK tetapi teks halaman mengandung
    | salah satu frasa di bawah ini, sistem memaksa status menjadi Tidak Aktif.
    |
    */
    'blacklist_keywords' => [
        // Frasa penutupan/penangguhan fatal (cocok di mana saja pada halaman)
        'fatal' => [
            'this site has been closed' => 'Situs Ditutup (This site has been closed)',
            'site has been closed by administrator' => 'Situs Ditutup Administrator',
            'account suspended' => 'Hosting Disuspend (Account Suspended)',
            'this account has been suspended' => 'Hosting Disuspend (Account Suspended)',
            'cgi-sys/suspendedpage.cgi' => 'Hosting Disuspend (Suspended Page)',
            'situs ini telah dinonaktifkan' => 'Situs Dinonaktifkan',
            'website ini telah dinonaktifkan' => 'Website Dinonaktifkan',
            'domain expired' => 'Domain Kedaluwarsa (Domain Expired)',
            'masa aktif domain telah habis' => 'Domain Kedaluwarsa',
            'this domain is parked' => 'Domain Diparkir (Parked Domain)',
            'error establishing a database connection' => 'Koneksi Database Gagal',
            'welcome to nginx!' => 'Halaman Default Server (Nginx)',
            'apache2 ubuntu default page' => 'Halaman Default Server (Apache)',
        ],

        // Frasa perbaikan/maintenance (cocok pada <title> atau halaman pendek < 1500 karakter)
        'maintenance' => [
            'website sedang dalam perbaikan' => 'Website Sedang Dalam Perbaikan',
            'situs sedang dalam perbaikan' => 'Situs Sedang Dalam Perbaikan',
            'sedang dalam pemeliharaan' => 'Website Sedang Dalam Pemeliharaan',
            'under maintenance' => 'Sedang Dalam Perbaikan (Under Maintenance)',
            'maintenance mode' => 'Sedang Dalam Perbaikan (Maintenance Mode)',
            'we\'ll be back soon' => 'Sedang Dalam Perbaikan (Maintenance)',
        ],
    ],
];
