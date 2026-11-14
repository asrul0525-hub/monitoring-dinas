interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
    return <div aria-hidden="true" className={`skeleton-shimmer ${className}`} />;
}

export function DashboardSkeleton() {
    return (
        <div
            role="status"
            aria-label="Memuat dashboard…"
            className="animate-page-enter grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
        >
            <div className="surface-card space-y-4 p-6 lg:col-span-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
                <div className="space-y-2.5 pt-1">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-line-subtle pt-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
            </div>

            <div className="surface-card space-y-3 p-6 lg:col-span-7">
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-3.5 w-72" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2 pt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                </div>
            </div>

            <div className="surface-card space-y-3 p-6 lg:col-span-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-56" />
                <div className="space-y-3 pt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            <div className="surface-card space-y-3 p-6 lg:col-span-5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-56" />
                <div className="space-y-2.5 pt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            <div className="surface-card space-y-3 p-6 lg:col-span-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-48" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function TablePageSkeleton({ showSummaryStrip = false, showFilterBar = false }: { showSummaryStrip?: boolean; showFilterBar?: boolean }) {
    return (
        <div role="status" aria-label="Memuat tabel…" className="animate-page-enter space-y-5">
            {showFilterBar && (
                <div className="surface-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12">
                    <Skeleton className="h-10 rounded-xl lg:col-span-3" />
                    <Skeleton className="h-10 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-10 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-10 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-10 rounded-xl lg:col-span-3" />
                </div>
            )}

            {showSummaryStrip && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="surface-card space-y-2 p-4">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                    <div className="surface-card space-y-2 p-4">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-7 w-16" />
                    </div>
                    <div className="surface-card space-y-2 p-4">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-7 w-14" />
                    </div>
                    <div className="surface-card space-y-2 p-4">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-7 w-16" />
                    </div>
                </div>
            )}

            <div className="surface-table overflow-hidden">
                <div className="grid grid-cols-7 gap-4 border-b border-line-subtle bg-surface-elevated px-4 py-3.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-3.5 w-24" />
                    ))}
                </div>
                <div className="divide-y divide-line-subtle">
                    {Array.from({ length: 8 }).map((_, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-7 items-center gap-4 px-4 py-3.5">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="ml-auto h-7 w-28 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function DetailPageSkeleton() {
    return (
        <div role="status" aria-label="Memuat detail instansi…" className="animate-page-enter space-y-5">
            <div className="surface-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
            <div className="surface-card space-y-4 p-6">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <TablePageSkeleton />
        </div>
    );
}

export function SettingsPageSkeleton() {
    return (
        <div role="status" aria-label="Memuat pengaturan…" className="animate-page-enter grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
                <div className="surface-card space-y-4 p-6">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-10 w-40 rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-10 w-48 rounded-full" />
                </div>
                <div className="surface-card flex items-center justify-between p-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-3.5 w-64" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>
            <div className="lg:col-span-6">
                <div className="surface-card space-y-4 p-6">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-44 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function AdaptivePageSkeleton({ path }: { path: string }) {
    if (path.startsWith('/laporan')) {
        return <TablePageSkeleton showFilterBar showSummaryStrip />;
    }
    if (path.startsWith('/log')) {
        return <TablePageSkeleton showFilterBar />;
    }
    if (/^\/instansi\/\d+/.test(path)) {
        return <DetailPageSkeleton />;
    }
    if (path.startsWith('/instansi')) {
        return <TablePageSkeleton />;
    }
    if (path.startsWith('/pengaturan')) {
        return <SettingsPageSkeleton />;
    }
    return <DashboardSkeleton />;
}
