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
        $candidates = [];

        // 1. Check <meta property="article:published_time|article:modified_time|og:updated_time" content="...">
        if (preg_match_all('/<meta\s+[^>]*?(?:property|name|itemprop)\s*=\s*["\'](?:article:published_time|article:modified_time|og:updated_time|pubdate|publishdate|date| datePublished|dateModified)["\'][^>]*?content\s*=\s*["\']([^"\']+)["\']/i', $html, $metaMatches)) {
            foreach ($metaMatches[1] as $raw) {
                $parsed = FeedParser::tryParseDate($raw);
                if ($parsed !== null) {
                    $candidates[] = $parsed;
                }
            }
        }

        // Also support reversed attribute order: content="..." property="article:published_time"
        if (preg_match_all('/<meta\s+[^>]*?content\s*=\s*["\']([^"\']+)["\'][^>]*?(?:property|name|itemprop)\s*=\s*["\'](?:article:published_time|article:modified_time|og:updated_time|pubdate|publishdate|date|datePublished|dateModified)["\']/i', $html, $revMatches)) {
            foreach ($revMatches[1] as $raw) {
                $parsed = FeedParser::tryParseDate($raw);
                if ($parsed !== null) {
                    $candidates[] = $parsed;
                }
            }
        }

        // 2. Check JSON-LD datePublished / dateModified
        if (preg_match_all('/"(?:datePublished|dateModified|uploadDate)"\s*:\s*"([^"]+)"/i', $html, $jsonLdMatches)) {
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

        $fromDom = FeedParser::latestValidDate($candidates);
        if ($fromDom !== null) {
            return $fromDom;
        }

        // 4. Fallback to HTTP Last-Modified header
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
}
