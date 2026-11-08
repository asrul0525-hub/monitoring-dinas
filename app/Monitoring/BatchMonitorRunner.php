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

        $concurrency = max(1, (int) config('monitoring.concurrency', 8));
        $total = 0;

        Instansi::query()
            ->orderBy('id')
            ->chunk($concurrency, function (Collection $chunk) use ($at, $onProgress, &$total) {
                $this->runLiveChunk($this->monitor, $chunk, $at, $onProgress);
                $total += $chunk->count();
            });

        return $total;
    }

    /**
     * @param  Collection<int, Instansi>  $chunk
     * @param  ?Closure(Instansi): void  $onProgress
     */
    private function runLiveChunk(
        LiveMonitor $liveMonitor,
        Collection $chunk,
        ?CarbonInterface $at = null,
        ?Closure $onProgress = null
    ): void {
        $timeout = (int) config('monitoring.timeout', 10);
        $connectTimeout = (int) config('monitoring.connect_timeout', 5);
        $verifySsl = (bool) config('monitoring.verify_ssl', false);
        $userAgent = (string) config('monitoring.user_agent', 'Diskominfo-HSU-Monitor/1.0');

        $startTimes = [];

        $responses = Http::pool(function (Pool $pool) use ($chunk, $timeout, $connectTimeout, $verifySsl, $userAgent, &$startTimes) {
            foreach ($chunk as $instansi) {
                $id = $instansi->id;
                $startTimes[$id] = hrtime(true);

                $req = $pool->as("main_{$id}")
                    ->timeout($timeout)
                    ->connectTimeout($connectTimeout)
                    ->withUserAgent($userAgent)
                    ->withHeaders([
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    ]);

                if (! $verifySsl) {
                    $req = $req->withoutVerifying();
                }

                $req->get($instansi->url);

                if ($instansi->feed_url) {
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
                } else {
                    $error = "HTTP {$httpCode}";
                }
            } elseif ($mainResult instanceof Throwable) {
                $error = $liveMonitor->formatExceptionMessage($mainResult);
            } else {
                $error = 'Koneksi jaringan gagal';
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
}
