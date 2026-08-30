import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  secondary:
    'bg-surface-muted text-foreground hover:bg-border active:bg-foreground-muted/30',
  danger: 'bg-danger text-primary-foreground hover:bg-danger/85 active:bg-danger/75',
  ghost: 'text-foreground-muted hover:bg-surface-muted hover:text-foreground active:bg-surface-muted',
  outline:
    'border border-border bg-surface text-foreground hover:bg-input active:bg-surface-muted',
};

// Fixed heights so controls line up across every toolbar and form row.
const sizes = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-1.5 px-3.5 text-sm',
  lg: 'h-10 gap-2 px-4 text-sm',
  icon: 'h-9 w-9',
  'icon-sm': 'h-8 w-8',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap',
          'transition-[background-color,border-color,color,transform] duration-150 ease-out',
          'active:scale-[0.98]',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
