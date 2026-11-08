<?php

use App\Enums\ContentSource;
use App\Monitoring\Parsers\ContentFreshnessParser;
use App\Monitoring\Parsers\FeedParser;
use App\Monitoring\Parsers\HtmlMetaParser;
use App\Monitoring\Parsers\SitemapParser;

it('FeedParser mengekstrak tanggal terbaru dari RSS 2.0 pubDate dan Atom updated', function () {
    $rss = <<<'XML'
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
        <channel>
            <title>Portal Berita Diskominfo HSU</title>
            <item>
                <title>Berita Lama</title>
                <pubDate>Mon, 02 Nov 2026 08:00:00 +0800</pubDate>
            </item>
            <item>
                <title>Berita Terbaru</title>
                <pubDate>Fri, 06 Nov 2026 14:30:00 +0800</pubDate>
            </item>
        </channel>
    </rss>
    XML;

    $date = FeedParser::parse($rss);
    expect($date)->not->toBeNull()
        ->and($date?->format('Y-m-d'))->toBe('2026-11-06');

    $atom = <<<'XML'
    <?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Feed Instansi</title>
        <entry>
            <title>Artikel Atom</title>
            <updated>2026-11-07T09:15:00+08:00</updated>
        </entry>
    </feed>
    XML;

    $atomDate = FeedParser::parse($atom);
    expect($atomDate)->not->toBeNull()
        ->and($atomDate?->format('Y-m-d'))->toBe('2026-11-07');
});

it('SitemapParser mengekstrak tanggal lastmod terbaru dari urlset maupun sitemapindex', function () {
    $sitemap = <<<'XML'
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
            <loc>https://diskominfo.hsu.go.id/berita/1</loc>
            <lastmod>2026-10-20T10:00:00+08:00</lastmod>
        </url>
        <url>
            <loc>https://diskominfo.hsu.go.id/berita/2</loc>
            <lastmod>2026-11-05T16:45:00+08:00</lastmod>
        </url>
    </urlset>
    XML;

    $date = SitemapParser::parse($sitemap);
    expect($date)->not->toBeNull()
        ->and($date?->format('Y-m-d'))->toBe('2026-11-05');
});

it('HtmlMetaParser mengekstrak tanggal dari meta article:published_time, JSON-LD, tag time, atau header Last-Modified', function () {
    $htmlMeta = <<<'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <meta property="article:published_time" content="2026-11-04T11:20:00+08:00" />
    </head>
    <body><h1>Selamat Datang</h1></body>
    </html>
    HTML;

    expect(HtmlMetaParser::parse($htmlMeta)?->format('Y-m-d'))->toBe('2026-11-04');

    $htmlJsonLd = <<<'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"NewsArticle","datePublished":"2026-11-03T08:00:00+08:00","dateModified":"2026-11-06T12:00:00+08:00"}
        </script>
    </head>
    <body></body>
    </html>
    HTML;

    expect(HtmlMetaParser::parse($htmlJsonLd)?->format('Y-m-d'))->toBe('2026-11-06');

    $htmlTimeTag = <<<'HTML'
    <html><body><article><time datetime="2026-11-02">2 November 2026</time></article></body></html>
    HTML;

    expect(HtmlMetaParser::parse($htmlTimeTag)?->format('Y-m-d'))->toBe('2026-11-02');

    $headerOnly = HtmlMetaParser::parse('<html><body>Tanpa tanggal</body></html>', [
        'Last-Modified' => ['Wed, 01 Nov 2026 07:00:00 GMT'],
    ]);
    expect($headerOnly?->format('Y-m-d'))->toBe('2026-11-01');
});

it('ContentFreshnessParser menangani input rusak/invalid dengan aman tanpa melempar exception', function () {
    expect(ContentFreshnessParser::parse('bukan xml ataupun html tanggal', 'https://dinas.hsu.go.id/rss.xml'))->toBeNull();

    $rss = '<rss><channel><item><pubDate>2026-11-07 10:00:00</pubDate></item></channel></rss>';
    $detected = ContentFreshnessParser::detectWithSource($rss, 'https://dinas.hsu.go.id/feed/rss', null);

    expect($detected['source'])->toBe(ContentSource::Rss)
        ->and($detected['date']?->format('Y-m-d'))->toBe('2026-11-07');
});
