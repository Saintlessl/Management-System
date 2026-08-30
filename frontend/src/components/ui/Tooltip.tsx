import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/utils';

/*
  Accessible tooltip for icon-only controls (primarily the collapsed sidebar).
  It shows on hover and on keyboard focus, and is wired via aria-describedby so
  the label reaches assistive technology rather than only sighted users.
*/
interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'right' | 'top';
  className?: string;
}

export function Tooltip({ label, children, side = 'right', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const id = useId();

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <span aria-describedby={isVisible ? id : undefined} className="inline-flex w-full">
        {children}
      </span>
      {isVisible && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-50 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-surface shadow-md',
            'motion-safe:animate-[fadeIn_140ms_ease-out]',
            side === 'right'
              ? 'top-1/2 left-full ml-2 -translate-y-1/2'
              : 'bottom-full left-1/2 mb-2 -translate-x-1/2'
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
