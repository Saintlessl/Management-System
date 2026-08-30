import { cn } from '@/utils';

/* Shared form-control chrome, separated from Field so React Fast Refresh sees a component-only module. */
export const controlBase = cn(
  'w-full rounded-lg border border-border bg-surface text-foreground caret-primary',
  'placeholder:text-foreground-muted',
  'transition-[border-color,box-shadow] duration-150 ease-out',
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20',
  'disabled:cursor-not-allowed disabled:bg-input disabled:text-foreground-muted'
);

/** 38px — inside the 36–42px enterprise control band. */
export const controlHeight = 'h-9.5 px-3 text-sm';

export const controlInvalid = 'border-danger focus:border-danger focus:ring-danger/20';
