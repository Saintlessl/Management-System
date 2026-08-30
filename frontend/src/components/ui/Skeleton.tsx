import { cn } from '@/utils';

/*
  Shimmer instead of a flat pulse: a highlight sweeps across the block, which
  reads as "loading" without the whole layout flickering. The gradient is
  paint-only and the animation is disabled under prefers-reduced-motion.
*/
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md bg-[linear-gradient(100deg,var(--tp-border)_40%,var(--tp-input)_50%,var(--tp-border)_60%)] bg-size-[200%_100%] animate-[shimmer_1.4s_linear_infinite]',
        className
      )}
    />
  );
}

/*
  Skeletons mirror the geometry of what they replace — same header band, same row
  height, same panel border — so content arriving does not shift the layout.
*/
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn('h-2.5', i === 0 ? 'w-32' : 'w-20')} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-72" />
            </div>
            {Array.from({ length: Math.max(0, cols - 1) }).map((_, c) => (
              <Skeleton key={c} className="h-5 w-20 shrink-0 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex justify-between border-t border-border pt-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2.5 rounded-xl border border-border bg-surface px-4 py-3.5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-2.5 w-28" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-64" />
          </div>
          <Skeleton className="h-2.5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
