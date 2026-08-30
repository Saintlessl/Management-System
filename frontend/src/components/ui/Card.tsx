import { type ReactNode, forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils';

/*
  Panels use one quiet elevation level so dense dashboard regions remain easy
  to scan without competing with dialogs, menus, or drag overlays.
*/
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Removes the default padding for panels that host a flush table or list. */
  flush?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, flush = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-w-0 rounded-xl border border-border/90 bg-surface/95 shadow-[0_1px_2px_rgba(20,27,55,0.025),0_12px_36px_-32px_rgba(31,36,99,0.34)]',
          !flush && 'p-5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const Panel = Card;

/**
 * Section header for a panel. `actions` sits opposite the title so every panel
 * puts its controls in the same place.
 */
export function CardHeader({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-[15px] font-semibold text-foreground', className)}>{children}</h2>;
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn('mt-0.5 text-[13px] text-foreground-muted', className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}
