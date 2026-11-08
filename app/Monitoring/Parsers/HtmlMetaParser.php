<?php

namespace App\Monitoring\Parsers;

use Carbon\CarbonImmutable;

class HtmlMetaParser
{
    /**
     * @param  array<string, mixed>  $headers
     */
    public static function parse(string $html, array $headers = []): ?CarbonImmutable
    {
        if (trim($html) !== '') {
            $candidates = [];

            // 1. Check <meta property="article:published_time|article:modified_time|og:updated_time" content="...">
            if (preg_match_all('/<meta\s+[^>]*?(?:property|name|itemprop)\s*=\s*["\'](?:article:published_time|article:modified_time|og:updated_time|pubdate|publishdate|date|datePublished|dateModified|DC\.date\.issued)["\'][^>]*?content\s*=\s*["\']([^"\']+)["\']/i', $html, $metaMatches)) {
                foreach ($metaMatches[1] as $raw) {
                    $parsed = FeedParser::tryParseDate($raw);
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            // Reversed attribute order: content="..." property="article:published_time"
            if (preg_match_all('/<meta\s+[^>]*?content\s*=\s*["\']([^"\']+)["\'][^>]*?(?:property|name|itemprop)\s*=\s*["\'](?:article:published_time|article:modified_time|og:updated_time|pubdate|publishdate|date|datePublished|dateModified|DC\.date\.issued)["\']/i', $html, $revMatches)) {
                foreach ($revMatches[1] as $raw) {
                    $parsed = FeedParser::tryParseDate($raw);
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            // 2. Check JSON-LD / JSON API fields (datePublished, dateModified, releaseDate, rl_date, cr_date)
            if (preg_match_all('/"(?:datePublished|dateModified|uploadDate|releaseDate|published_at|created_at|rl_date|tgl_rilis|tanggal)"\s*:\s*"([^"]+)"/i', $html, $jsonLdMatches)) {
                foreach ($jsonLdMatches[1] as $raw) {
                    $parsed = FeedParser::tryParseDate($raw);
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            // 3. Check <time datetime="...">
            if (preg_match_all('/<time\s+[^>]*?datetime\s*=\s*["\']([^"\']+)["\']/i', $html, $timeMatches)) {
                foreach ($timeMatches[1] as $raw) {
                    $parsed = FeedParser::tryParseDate($raw);
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            // 4. Check URL href date patterns (e.g. /pressrelease/2026/11/05/... or /berita/2026-10-26/...)
            if (preg_match_all('/href\s*=\s*["\'][^"\']*?[\/\-_](20[2-9][0-9])[\/\-_](0[1-9]|1[0-2])[\/\-_](0[1-9]|[12][0-9]|3[01])(?:[\/\-_."\']|$)/i', $html, $hrefMatches, PREG_SET_ORDER)) {
                foreach ($hrefMatches as $hm) {
                    $iso = "{$hm[1]}-{$hm[2]}-{$hm[3]}";
                    $parsed = FeedParser::tryParseDate($iso);
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            // 5. Check visible DOM text for Indonesian & English written dates (e.g. "5 November 2026", "26 Oktober 2026")
            $visibleText = preg_replace('/<(script|style|noscript|svg|head)[^>]*>.*?<\/\1>/is', ' ', $html) ?? $html;
            $visibleText = html_entity_decode(strip_tags($visibleText), ENT_QUOTES | ENT_HTML5, 'UTF-8');

            if (preg_match_all('/\b([0-3]?[0-9]\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Ags|Sep|Sept|Okt|Nov|Des|January|February|March|April|May|June|July|August|September|October|November|December)\s+20[2-9][0-9])\b/iu', $visibleText, $textDateMatches)) {
                foreach ($textDateMatches[1] as $rawTextDate) {
                    $parsed = FeedParser::tryParseDate($rawTextDate);
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            // 6. Check labeled numeric dates in visible text (e.g. "Tanggal: 05-11-2026" or "05/11/2026")
            if (preg_match_all('/\b(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](20[2-9][0-9])\b/', $visibleText, $dmyMatches, PREG_SET_ORDER)) {
                foreach ($dmyMatches as $dm) {
                    $parsed = FeedParser::tryParseDate("{$dm[3]}-{$dm[2]}-{$dm[1]}");
                    if ($parsed !== null) {
                        $candidates[] = $parsed;
                    }
                }
            }

            $fromDom = FeedParser::latestValidDate($candidates);
            if ($fromDom !== null) {
                return $fromDom;
            }
        }

        // 7. Fallback to HTTP Last-Modified header
        foreach ($headers as $key => $val) {
            if (strtolower((string) $key) === 'last-modified') {
                $headerVal = is_array($val) ? ($val[0] ?? '') : (string) $val;
                $parsed = FeedParser::tryParseDate($headerVal);
                if ($parsed !== null) {
                    return $parsed;
                }
            }
        }

        return null;
    }

    public static function parseFromRscStream(string $rscPayload): ?CarbonImmutable
    {
        if (trim($rscPayload) === '') {
            return null;
        }

        $candidates = [];

        // Extract ISO dates (YYYY-MM-DD) that are not `"end":"YYYY-MM-DD"` expiry dates
        $cleaned = preg_replace('/"end"\s*:\s*"20[2-9][0-9]-[0-1][0-9]-[0-3][0-9]"/i', '', $rscPayload) ?? $rscPayload;

        if (preg_match_all('/\b(20[2-9][0-9]-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01]))\b/', $cleaned, $isoMatches)) {
            foreach ($isoMatches[1] as $iso) {
                $parsed = FeedParser::tryParseDate($iso);
                if ($parsed !== null) {
                    $candidates[] = $parsed;
                }
            }
        }

        if (preg_match_all('/\b([0-3]?[0-9]\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Ags|Sep|Sept|Okt|Nov|Des)\s+20[2-9][0-9])\b/iu', $cleaned, $idMatches)) {
            foreach ($idMatches[1] as $raw) {
                $parsed = FeedParser::tryParseDate($raw);
                if ($parsed !== null) {
                    $candidates[] = $parsed;
                }
            }
        }

        return FeedParser::latestValidDate($candidates);
    }

    /**
     * Discover RSS/Atom feed and Sitemap URLs from <link> tags in HTML.
     *
     * @return array<int, string>
     */
    public static function discoverFeedUrls(string $html, string $baseUrl): array
    {
        if (trim($html) === '') {
            return [];
        }

        $urls = [];

        if (preg_match_all('/<link\s+[^>]*?(?:type\s*=\s*["\'](?:application\/rss\+xml|application\/atom\+xml)["\']|rel\s*=\s*["\']sitemap["\'])[^>]*?>/i', $html, $linkTags)) {
            foreach ($linkTags[0] as $tag) {
                // Skip WordPress comments feed
                if (stripos($tag, 'comments/feed') !== false || stripos($tag, 'Komentar') !== false) {
                    continue;
                }

                if (preg_match('/href\s*=\s*["\']([^"\']+)["\']/i', $tag, $hrefMatch)) {
                    $resolved = self::resolveUrl(trim($hrefMatch[1]), $baseUrl);
                    if ($resolved !== null) {
                        $urls[] = $resolved;
                    }
                }
            }
        }

        return array_values(array_unique($urls));
    }

    public static function resolveUrl(string $href, string $baseUrl): ?string
    {
        if ($href === '' || str_starts_with($href, '#') || str_starts_with(strtolower($href), 'javascript:')) {
            return null;
        }

        if (str_starts_with($href, 'http://') || str_starts_with($href, 'https://')) {
            return $href;
        }

        $parsedBase = parse_url($baseUrl);
        if (! is_array($parsedBase) || empty($parsedBase['scheme']) || empty($parsedBase['host'])) {
            return null;
        }

        $origin = $parsedBase['scheme'].'://'.$parsedBase['host'].(isset($parsedBase['port']) ? ':'.$parsedBase['port'] : '');

        if (str_starts_with($href, '//')) {
            return $parsedBase['scheme'].':'.$href;
        }

        if (str_starts_with($href, '/')) {
            return $origin.$href;
        }

        return $origin.'/'.ltrim($href, '/');
    }
}
