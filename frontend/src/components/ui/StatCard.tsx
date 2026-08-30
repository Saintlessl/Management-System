import { type ElementType } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';

/*
  A compact metric tile. It shows a label, a value, and — only when the API
  actually supplies one — a real supporting fact. There is deliberately no
  trend/percentage slot: the dashboard endpoint returns no historical series, so
  any "+26% from last month" here would be invented.

  The optional icon sits in a small tinted tile purely to give the row a visual
  anchor; it never carries meaning on its own.
*/
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ElementType;
  /** A real, API-derived detail. Omit rather than filling with decoration. */
  detail?: string;
  /** Emphasises the value when the metric needs attention (overdue, blocked). */
  tone?: 'default' | 'warning' | 'danger';
  to?: string;
  className?: string;
}

const valueTones = {
  default: 'text-foreground group-hover:text-primary',
  warning: 'text-warning',
  danger: 'text-danger',
};

const iconTileTones = {
  default: 'bg-primary-subtle text-primary ring-1 ring-primary/10',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  detail,
  tone = 'default',
  to,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <p className="text-[10px] font-semibold leading-4 tracking-[0.08em] text-foreground-muted uppercase sm:text-[11px]">{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8',
              iconTileTones[tone]
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-3 text-[1.65rem] font-semibold tabular-nums tracking-[-0.035em] leading-none transition-colors sm:text-[2rem]',
          valueTones[tone]
        )}
      >
        {value}
      </p>
      {detail && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-foreground-muted sm:text-xs">{detail}</p>}
    </>
  );

  const shell = cn(
    'group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-xl border border-border/90 bg-surface/95 px-3.5 py-3.5 shadow-[0_1px_2px_rgba(20,27,55,0.025)] sm:min-h-36 sm:px-4 sm:py-4',
    className
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          shell,
          'transition-[border-color,box-shadow,transform] duration-150 ease-out',
          'after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-transform',
          'motion-safe:hover:-translate-y-0.5 hover:border-primary-border hover:shadow-[0_12px_30px_-20px_rgba(48,52,130,0.34)] hover:after:scale-x-100'
        )}
      >
        {body}
      </Link>
    );
  }

  return <article className={shell}>{body}</article>;
}
