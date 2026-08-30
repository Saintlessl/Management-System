import { type ReactNode, type ElementType } from 'react';
import { cn } from '@/utils';
import { Button } from './Button';

/*
  Useful, not decorative: a headline that names the situation, one line telling
  the user what to do, and the action that does it. No illustration.
*/
interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ElementType;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-12 text-center',
        className
      )}
    >
      {Icon && <Icon className="h-6 w-6 text-foreground-muted/80" aria-hidden="true" />}
      <h3 className={cn('text-[15px] font-semibold text-foreground', Icon && 'mt-3')}>{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-foreground-muted">{description}</p>}

      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          {actionLabel}
        </Button>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
