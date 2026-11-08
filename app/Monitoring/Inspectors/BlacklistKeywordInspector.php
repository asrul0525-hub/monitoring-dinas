<?php

namespace App\Monitoring\Inspectors;

class BlacklistKeywordInspector
{
    /**
     * Periksa apakah HTML halaman yang mengembalikan HTTP 200 OK sebenarnya
     * merupakan halaman situs ditutup, disuspend, domain expired, atau maintenance.
     *
     * @return string|null Alasan penolakan jika terdeteksi kata kunci blacklist, atau null jika normal.
     */
    public static function inspect(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        // Ekstrak teks <title>
        $titleText = '';
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $titleMatch)) {
            $titleText = mb_strtolower(trim(html_entity_decode(strip_tags($titleMatch[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        }

        // Bersihkan script & style sebelum mengambil teks body yang terlihat
        $cleanHtml = preg_replace('/<(script|style|noscript)\b[^>]*>.*?<\/\1>/is', ' ', $html) ?? $html;
        $visibleText = html_entity_decode(strip_tags($cleanHtml), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $normalizedBody = mb_strtolower(trim(preg_replace('/\s+/u', ' ', $visibleText) ?? $visibleText));
        $rawLower = mb_strtolower($html);

        /** @var array<string, string> $fatalKeywords */
        $fatalKeywords = config('monitoring.blacklist_keywords.fatal', [
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
        ]);

        foreach ($fatalKeywords as $phrase => $reason) {
            $needle = mb_strtolower($phrase);
            if (
                ($titleText !== '' && str_contains($titleText, $needle))
                || str_contains($normalizedBody, $needle)
                || str_contains($rawLower, $needle)
            ) {
                return $reason;
            }
        }

        /** @var array<string, string> $maintenanceKeywords */
        $maintenanceKeywords = config('monitoring.blacklist_keywords.maintenance', [
            'website sedang dalam perbaikan' => 'Website Sedang Dalam Perbaikan',
            'situs sedang dalam perbaikan' => 'Situs Sedang Dalam Perbaikan',
            'sedang dalam pemeliharaan' => 'Website Sedang Dalam Pemeliharaan',
            'under maintenance' => 'Sedang Dalam Perbaikan (Under Maintenance)',
            'maintenance mode' => 'Sedang Dalam Perbaikan (Maintenance Mode)',
            'we\'ll be back soon' => 'Sedang Dalam Perbaikan (Maintenance)',
        ]);

        $isShortPage = mb_strlen($normalizedBody) < 1500;

        foreach ($maintenanceKeywords as $phrase => $reason) {
            $needle = mb_strtolower($phrase);
            if (
                ($titleText !== '' && str_contains($titleText, $needle))
                || ($isShortPage && str_contains($normalizedBody, $needle))
            ) {
                return $reason;
            }
        }

        return null;
    }
}
