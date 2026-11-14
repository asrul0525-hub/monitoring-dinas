<?php

namespace App\Monitoring;

use App\Jobs\CheckInstansiJob;
use App\Models\Instansi;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

class BatchMonitorRunner
{
    public function __construct(
        private readonly Monitor $monitor,
    ) {}

    /**
     * @param  ?Closure(Instansi): void  $onProgress
     */
    public function runAll(bool $async = false, ?CarbonInterface $at = null, ?Closure $onProgress = null): int
    {
        if ($async) {
            $count = 0;
            foreach (Instansi::query()->select(['id'])->cursor() as $instansi) {
                CheckInstansiJob::dispatch((int) $instansi->id);
                $count++;
            }

            return $count;
        }

        if (! ($this->monitor instanceof LiveMonitor)) {
            $count = 0;
            foreach (Instansi::query()->cursor() as $instansi) {
                $this->monitor->check($instansi, $at);
                if ($onProgress) {
                    $onProgress($instansi);
                }
                $count++;
            }

            return $count;
        }

        $concurrency = max(1, (int) config('monitoring.concurrency', 4));
        $allInstansis = Instansi::query()->orderBy('id')->get();
        if ($allInstansis->isEmpty()) {
            return 0;
        }

        $waves = self::interleaveIntoWaves($allInstansis, $concurrency);
        $deferredRetries = [];
        $total = 0;

        foreach ($waves as $wave) {
            $this->runLiveChunk($this->monitor, $wave, $deferredRetries, $at, $onProgress);
            $total += $wave->count();
        }

        if ($deferredRetries !== []) {
            $this->processDeferredRetries($this->monitor, $deferredRetries, $at, $onProgress);
        }

        return $total;
    }

    /**
     * Sebar urutan instansi ke dalam gelombang (waves) menggunakan metode card-dealing
     * berdasarkan klaster subdomain/kategori agar website pada satu server bersama
     * (misal pkm-*.hsu.go.id atau kec-*.hsu.go.id) tidak pernah menumpuk di gelombang yang sama.
     *
     * @param  Collection<int, Instansi>  $instansis
     * @return array<int, Collection<int, Instansi>>
     */
    public static function interleaveIntoWaves(Collection $instansis, int $concurrency): array
    {
        $concurrency = max(1, $concurrency);
        $count = $instansis->count();
        if ($count === 0) {
            return [];
        }

        $numWaves = max(1, (int) ceil($count / $concurrency));

        $clustered = $instansis
            ->groupBy(fn (Instansi $instansi) => self::resolveServerCluster($instansi))
            ->sortByDesc(fn (Collection $group) => $group->count())
            ->flatten(1)
            ->values();

        /** @var array<int, array<int, Instansi>> $buckets */
        $buckets = array_fill(0, $numWaves, []);

        foreach ($clustered as $index => $instansi) {
            $buckets[$index % $numWaves][] = $instansi;
        }

        return array_values(array_map(
            fn (array $items) => new Collection($items),
            array_filter($buckets, fn (array $items) => $items !== [])
        ));
    }

    public static function resolveServerCluster(Instansi $instansi): string
    {
        $host = strtolower((string) parse_url($instansi->url, PHP_URL_HOST));

        if (str_starts_with($host, 'pkm-')) {
            return 'cluster_pkm';
        }

        if (str_starts_with($host, 'kec-') || str_starts_with($host, 'kel-')) {
            return 'cluster_kec_kel';
        }

        if (! str_ends_with($host, '.hsu.go.id') && $host !== 'hsu.go.id') {
            return 'cluster_external';
        }

        return 'cluster_'.($instansi->kategori ?: 'lainnya');
    }

    /**
     * @param  Collection<int, Instansi>  $chunk
     * @param  array<int, array{instansi: Instansi, attempt: array<string, mixed>}>  $deferredRetries
     * @param  ?Closure(Instansi): void  $onProgress
     */
    private function runLiveChunk(
        LiveMonitor $liveMonitor,
        Collection $chunk,
        array &$deferredRetries,
        ?CarbonInterface $at = null,
        ?Closure $onProgress = null
    ): void {
        $timeout = (int) config('monitoring.timeout', 14);
        $connectTimeout = (int) config('monitoring.connect_timeout', 6);
        $verifySsl = (bool) config('monitoring.verify_ssl', false);
        $userAgent = (string) config(
            'monitoring.user_agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        $startTimes = [];

        $responses = Http::pool(function (Pool $pool) use ($chunk, $timeout, $connectTimeout, $verifySsl, $userAgent, $at, &$startTimes) {
            foreach ($chunk as $instansi) {
                $id = $instansi->id;
                $startTimes[$id] = hrtime(true);

                $req = $pool->as("main_{$id}")
                    ->timeout($timeout)
                    ->connectTimeout($connectTimeout)
                    ->withUserAgent($userAgent)
                    ->withHeaders(LiveMonitor::defaultBrowserHeaders());

                if (! $verifySsl) {
                    $req = $req->withoutVerifying();
                }

                $req->get($instansi->url);

                // Hanya unduh feed_url secara paralel jika konten perlu disegarkan (Smart Feed Caching)
                if ($instansi->feed_url && LiveMonitor::shouldRefreshContentFeed($instansi, $at)) {
                    $feedReq = $pool->as("feed_{$id}")
                        ->timeout(min(6, $timeout))
                        ->connectTimeout($connectTimeout)
                        ->withUserAgent($userAgent);

                    if (! $verifySsl) {
                        $feedReq = $feedReq->withoutVerifying();
                    }

                    $feedReq->get($instansi->feed_url);
                }
            }
        });

        foreach ($chunk as $instansi) {
            $id = $instansi->id;
            $mainResult = $responses["main_{$id}"] ?? null;
            $feedResult = $responses["feed_{$id}"] ?? null;

            $httpCode = null;
            $responseMs = null;
            $htmlBody = null;
            $headers = [];
            $feedBody = null;
            $error = null;

            if ($mainResult instanceof Response) {
                $httpCode = $mainResult->status();
                $transferTime = $mainResult->transferStats?->getTransferTime();
                $elapsedMs = $transferTime !== null
                    ? (int) round($transferTime * 1000)
                    : (int) round((hrtime(true) - ($startTimes[$id] ?? hrtime(true))) / 1_000_000);
                $responseMs = max(1, $elapsedMs);
                $headers = $mainResult->headers();

                if ($httpCode === 200) {
                    $htmlBody = $mainResult->body();
                    if ($feedResult instanceof Response && $feedResult->successful()) {
                        $feedBody = $feedResult->body();
                    }
                } elseif ($httpCode === 403) {
                    $fallback = \App\Monitoring\Parsers\NextJsActionExtractor::fetchCleanHtml($instansi->url);
                    if ($fallback !== null) {
                        $httpCode = 200;
                        $htmlBody = $fallback;
                        $error = null;
                    } else {
                        $error = 'Terproteksi WAF / CDN (HTTP 403)';
                    }
                } else {
                    $error = "HTTP {$httpCode}";
                }
            } elseif ($mainResult instanceof Throwable) {
                $error = $liveMonitor->formatExceptionMessage($mainResult);
            } else {
                $error = 'Koneksi jaringan gagal';
            }

            // Hanya jadwalkan verifikasi ulang jika gagal dengan kode HTTP transien (misal 503/502)
            // atau jika terkena timeout pada website yang sebelumnya TIDAK berstatus Tidak Aktif,
            // sehingga website mati yang sudah Tidak Aktif tidak menahan waktu tunggu 2x.
            $shouldRetryInBatch = LiveMonitor::isTransientFailure($httpCode, $error)
                && ($httpCode !== null || $instansi->status !== \App\Enums\Status::TidakAktif);

            if ($shouldRetryInBatch) {
                $deferredRetries[] = [
                    'instansi' => $instansi,
                    'attempt' => [
                        'http_code' => $httpCode,
                        'response_ms' => $responseMs,
                        'html_body' => $htmlBody,
                        'headers' => $headers,
                        'feed_body' => $feedBody,
                        'error' => $error,
                    ],
                ];

                continue;
            }

            $liveMonitor->recordCheckResult(
                $instansi,
                $httpCode,
                $responseMs,
                $htmlBody,
                $headers,
                $feedBody,
                $error,
                $at
            );

            if ($onProgress) {
                $onProgress($instansi);
            }
        }
    }

    /**
     * Verifikasi ulang secara satuan (1-per-1) untuk instansi yang gagal transien (503, Timeout, dll.)
     * saat pemeriksaan paralel agar tidak terjadi false-down akibat antrean server bersama.
     *
     * @param  array<int, array{instansi: Instansi, attempt: array<string, mixed>}>  $deferredRetries
     * @param  ?Closure(Instansi): void  $onProgress
     */
    private function processDeferredRetries(
        LiveMonitor $liveMonitor,
        array $deferredRetries,
        ?CarbonInterface $at = null,
        ?Closure $onProgress = null
    ): void {
        $retryTimeout = max(15, (int) config('monitoring.timeout', 14));

        foreach ($deferredRetries as $item) {
            /** @var Instansi $instansi */
            $instansi = $item['instansi'];
            $initial = $item['attempt'];

            LiveMonitor::waitBeforeRetry(1500);
            $verified = $liveMonitor->performSingleFetch($instansi, $retryTimeout, $at, forceSkipFeed: true);

            // Jika percobaan verifikasi pertama masih terkena 503 atau Timeout,
            // gunakan fallback koneksi cURL mandiri yang bersih dengan batas 15 detik
            if (
                $verified['http_code'] !== 200
                && ! app()->runningUnitTests()
                && LiveMonitor::isSoftTransientFailure($verified['http_code'], $verified['error'])
            ) {
                LiveMonitor::waitBeforeRetry(1500);
                $curlStartNs = hrtime(true);
                $cleanHtml = \App\Monitoring\Parsers\NextJsActionExtractor::fetchCleanHtml($instansi->url, timeout: 15);
                if ($cleanHtml !== null) {
                    $elapsedMs = max(1, (int) round((hrtime(true) - $curlStartNs) / 1_000_000));
                    $verified = [
                        'http_code' => 200,
                        'response_ms' => $elapsedMs,
                        'html_body' => $cleanHtml,
                        'headers' => [],
                        'feed_body' => null,
                        'error' => null,
                    ];
                }
            }

            $final = ($verified['http_code'] !== null || $initial['http_code'] === null)
                ? $verified
                : $initial;

            $liveMonitor->recordCheckResult(
                $instansi,
                $final['http_code'],
                $final['response_ms'],
                $final['html_body'],
                $final['headers'],
                $final['feed_body'],
                $final['error'],
                $at
            );

            if ($onProgress) {
                $onProgress($instansi);
            }
        }
    }
}
