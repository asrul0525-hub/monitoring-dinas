<?php

namespace App\Monitoring\Parsers;

use App\Enums\ContentSource;
use Carbon\CarbonImmutable;

class ContentFreshnessParser
{
    /**
     * @param  array<string, mixed>  $headers
     */
    public static function parse(string $htmlOrXml, ?string $feedUrl = null, array $headers = []): ?CarbonImmutable
    {
        if ($feedUrl !== null && $feedUrl !== '') {
            $lowerUrl = strtolower($feedUrl);
            if (str_contains($lowerUrl, 'sitemap')) {
                $date = SitemapParser::parse($htmlOrXml) ?? FeedParser::parse($htmlOrXml);
                if ($date !== null) {
                    return $date;
                }
            } else {
                $date = FeedParser::parse($htmlOrXml) ?? SitemapParser::parse($htmlOrXml);
                if ($date !== null) {
                    return $date;
                }
            }
        }

        return FeedParser::parse($htmlOrXml)
            ?? SitemapParser::parse($htmlOrXml)
            ?? HtmlMetaParser::parse($htmlOrXml, $headers);
    }

    /**
     * @param  array<string, mixed>  $headers
     * @return array{date: ?CarbonImmutable, source: ContentSource}
     */
    public static function detectWithSource(
        ?string $feedContent,
        ?string $feedUrl,
        ?string $htmlBody,
        array $headers = []
    ): array {
        if ($feedContent !== null && trim($feedContent) !== '') {
            $isSitemap = $feedUrl !== null && str_contains(strtolower($feedUrl), 'sitemap')
                || str_contains(strtolower($feedContent), '<urlset')
                || str_contains(strtolower($feedContent), '<sitemapindex');

            if ($isSitemap) {
                $date = SitemapParser::parse($feedContent);
                if ($date !== null) {
                    return ['date' => $date, 'source' => ContentSource::Sitemap];
                }
            }

            $feedDate = FeedParser::parse($feedContent);
            if ($feedDate !== null) {
                return ['date' => $feedDate, 'source' => ContentSource::Rss];
            }

            $sitemapFallback = SitemapParser::parse($feedContent);
            if ($sitemapFallback !== null) {
                return ['date' => $sitemapFallback, 'source' => ContentSource::Sitemap];
            }
        }

        if ($htmlBody !== null && trim($htmlBody) !== '') {
            $htmlDate = HtmlMetaParser::parse($htmlBody, $headers);
            if ($htmlDate !== null) {
                return ['date' => $htmlDate, 'source' => ContentSource::Dom];
            }
        }

        $headerDate = HtmlMetaParser::parse('', $headers);

        return ['date' => $headerDate, 'source' => ContentSource::Dom];
    }
}
