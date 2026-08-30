import { cn } from '@/utils';

interface ProgressProps {
  value: number;
  className?: string;
  /** `sm` for inline table cells, `md` for panel-level progress. */
  size?: 'sm' | 'md';
  label?: string;
}

export function Progress({ value, className, size = 'sm', label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-muted',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className
      )}
    >
      <div
        className={cn(
          'h-full origin-left rounded-full bg-primary',
          // Fills grow from zero on mount; later value changes still transition by width.
          'motion-safe:animate-[growMeter_600ms_var(--ease-out-quart)]',
          'transition-[width] duration-300 ease-out'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
