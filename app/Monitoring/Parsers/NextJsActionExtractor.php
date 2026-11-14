<?php

namespace App\Monitoring\Parsers;

use Carbon\CarbonImmutable;
use Throwable;

class NextJsActionExtractor
{
    public static function isNextJsAppRouterPage(string $html): bool
    {
        return (str_contains($html, '/_next/static/chunks/') && str_contains($html, '__next_f'))
            || str_contains($html, '<APM_DO_NOT_TOUCH>');
    }

    public static function fetchCleanHtml(string $url, int $timeout = 8, bool $verifySsl = false): ?string
    {
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $res = self::curlMultiGet([$url], $timeout, $verifySsl, $userAgent);
        $body = $res[0] ?? null;

        return ($body !== null && trim($body) !== '') ? $body : null;
    }

    public static function extractLatestDate(string $html, string $pageUrl, int $timeout = 6, bool $verifySsl = false): ?CarbonImmutable
    {
        if (! self::isNextJsAppRouterPage($html)) {
            return null;
        }

        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        // If WAF returned an <APM_DO_NOT_TOUCH> wrapper to Guzzle, fetch clean HTML via native curl HTTP/2
        if (str_contains($html, '<APM_DO_NOT_TOUCH>') || ! str_contains($html, '/_next/static/chunks/')) {
            $fetched = self::curlMultiGet([$pageUrl], $timeout, $verifySsl, $userAgent);
            $html = $fetched[0] ?? $html;
            $directParsed = HtmlMetaParser::parse($html);
            if ($directParsed !== null) {
                return $directParsed;
            }
        }

        if (! preg_match_all('/src\s*=\s*["\'](\/_next\/static\/chunks\/[^"\']+\.js)["\']/i', $html, $chunkMatches)) {
            return null;
        }

        $chunkUrls = [];
        foreach (array_unique($chunkMatches[1]) as $relPath) {
            if (str_contains($relPath, 'polyfills') || str_contains($relPath, 'turbopack') || str_contains($relPath, 'webpack')) {
                continue;
            }
            $resolved = HtmlMetaParser::resolveUrl($relPath, $pageUrl);
            if ($resolved !== null) {
                $chunkUrls[] = $resolved;
            }
        }

        if ($chunkUrls === []) {
            return null;
        }

        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        try {
            // 1. Fetch JS chunks concurrently using curl_multi with HTTP/2
            $chunkBodies = self::curlMultiGet(array_slice($chunkUrls, 0, 35), $timeout, $verifySsl, $userAgent);

            $actionIds = [];
            foreach ($chunkBodies as $js) {
                if (preg_match_all('/"([467]0[0-9a-f]{38,40})"/', $js, $m)) {
                    foreach ($m[1] as $actionId) {
                        $actionIds[$actionId] = true;
                    }
                }
            }

            if ($actionIds === []) {
                return null;
            }

            // 2. Invoke discovered Next.js Server Actions concurrently using curl_multi
            $actionPayloads = self::curlMultiPostActions(
                $pageUrl,
                array_slice(array_keys($actionIds), 0, 15),
                $timeout,
                $verifySsl,
                $userAgent
            );

            $candidates = [];
            foreach ($actionPayloads as $rscBody) {
                $dt = HtmlMetaParser::parseFromRscStream($rscBody);
                if ($dt !== null) {
                    $candidates[] = $dt;
                }
            }

            return FeedParser::latestValidDate($candidates);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<int, string>  $urls
     * @return array<int, string>
     */
    private static function curlMultiGet(array $urls, int $timeout, bool $verifySsl, string $userAgent): array
    {
        $mh = curl_multi_init();
        $handles = [];

        foreach ($urls as $idx => $url) {
            $ch = curl_init($url);
            if ($ch === false) {
                continue;
            }
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => min(6, max(4, $timeout)),
                CURLOPT_SSL_VERIFYPEER => $verifySsl,
                CURLOPT_SSL_VERIFYHOST => $verifySsl ? 2 : 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_USERAGENT => $userAgent,
            ]);
            curl_multi_add_handle($mh, $ch);
            $handles[$idx] = $ch;
        }

        self::execMulti($mh);

        $results = [];
        foreach ($handles as $idx => $ch) {
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($code >= 200 && $code < 300) {
                $results[$idx] = (string) curl_multi_getcontent($ch);
            }
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
        }
        curl_multi_close($mh);

        return $results;
    }

    /**
     * @param  array<int, string>  $actionIds
     * @return array<string, string>
     */
    private static function curlMultiPostActions(
        string $pageUrl,
        array $actionIds,
        int $timeout,
        bool $verifySsl,
        string $userAgent
    ): array {
        $mh = curl_multi_init();
        $handles = [];

        foreach ($actionIds as $actionId) {
            $ch = curl_init($pageUrl);
            if ($ch === false) {
                continue;
            }
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => '["id"]',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => 4,
                CURLOPT_SSL_VERIFYPEER => $verifySsl,
                CURLOPT_SSL_VERIFYHOST => $verifySsl ? 2 : 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_USERAGENT => $userAgent,
                CURLOPT_HTTPHEADER => [
                    "next-action: {$actionId}",
                    'accept: text/x-component',
                    'content-type: text/plain;charset=UTF-8',
                ],
            ]);
            curl_multi_add_handle($mh, $ch);
            $handles[$actionId] = $ch;
        }

        self::execMulti($mh);

        $results = [];
        foreach ($handles as $actionId => $ch) {
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($code >= 200 && $code < 300) {
                $results[$actionId] = (string) curl_multi_getcontent($ch);
            }
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
        }
        curl_multi_close($mh);

        return $results;
    }

    private static function execMulti(\CurlMultiHandle $mh): void
    {
        $active = null;
        do {
            $status = curl_multi_exec($mh, $active);
            if ($active) {
                curl_multi_select($mh, 0.2);
            }
        } while ($active && $status === CURLM_OK);
    }
}
