<?php

namespace App\Monitoring\Parsers;

use Carbon\CarbonImmutable;

class SitemapParser
{
    public static function parse(string $xml): ?CarbonImmutable
    {
        $trimmed = trim($xml);
        if ($trimmed === '' || ! str_contains($trimmed, '<')) {
            return null;
        }

        $candidates = [];

        if (preg_match_all('/<lastmod[^>]*>([^<]+)<\/lastmod>/i', $trimmed, $matches)) {
            foreach ($matches[1] as $rawDate) {
                $parsed = FeedParser::tryParseDate(trim(html_entity_decode($rawDate, ENT_QUOTES | ENT_XML1, 'UTF-8')));
                if ($parsed !== null) {
                    $candidates[] = $parsed;
                }
            }
        }

        return FeedParser::latestValidDate($candidates);
    }
}
