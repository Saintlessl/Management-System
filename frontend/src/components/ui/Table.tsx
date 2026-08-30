import { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';
import { cn } from '@/utils';

/*
  Table primitives.

  Rows are 48–52px, separators are hairlines, and the header is a quiet
  uppercase band rather than a filled bar. The horizontal scroll lives on the
  wrapper so a wide table never pushes the page body sideways.
*/

export function TableWrap({
  children,
  className,
  footer,
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

export function Table({
  children,
  className,
  minWidth = 'min-w-[52rem]',
}: {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return <table className={cn('w-full text-left text-sm', minWidth, className)}>{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-border">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export function Th({ children, className, align = 'left', ...props }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-2.5 text-[11px] font-semibold tracking-wide text-foreground-muted uppercase whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
  interactive = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
} & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-150 ease-out',
        interactive && 'hover:bg-input',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export function Td({ children, className, align = 'left', ...props }: TdProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle text-foreground',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Primary identity cell: a strong title over quiet supporting text. */
export function CellStack({
  title,
  subtitle,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate font-medium text-foreground">{title}</div>
      {subtitle && <div className="mt-0.5 truncate text-xs text-foreground-muted">{subtitle}</div>}
    </div>
  );
}
