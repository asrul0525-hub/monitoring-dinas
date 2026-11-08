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
            aria-label="Memuat data dashboard…"
            className="animate-page-enter grid grid-cols-12 gap-5"
        >
            <div className="surface-card col-span-5 space-y-4 p-6">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
                <div className="space-y-4 pt-4">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
            </div>

            <div className="surface-card col-span-7 space-y-3 p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-2.5 pt-3">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>

            <div className="surface-card col-span-4 space-y-3 p-5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>

            <div className="surface-card col-span-4 space-y-3 p-5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>

            <div className="surface-card col-span-4 space-y-3 p-5">
                <Skeleton className="h-4 w-36" />
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
