import { type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils';
import { controlBase } from './fieldStyles';

/*
  Compact filter toolbar. It is a single hairline-bordered row rather than a
  padded card — filters are chrome for the data below, so they should not consume
  panel-sized space or compete with the content.
*/
interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
  };
  /** Selects and other narrow controls. */
  children?: ReactNode;
  /** Rendered only when at least one filter is active. */
  onClear?: () => void;
  className?: string;
}

export function FilterBar({ search, children, onClear, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border bg-surface p-2 sm:flex-row sm:items-center',
        className
      )}
    >
      {search && (
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-muted/80"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? 'Cari...'}
            aria-label={search.label ?? search.placeholder ?? 'Cari'}
            className={cn(controlBase, 'h-9 border-transparent bg-input pr-3 pl-9 text-sm')}
          />
        </div>
      )}

      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-foreground-muted transition-colors duration-150 ease-out hover:bg-surface-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Reset filter
        </button>
      )}
    </div>
  );
}

/** Narrow select slot sized for a toolbar rather than a form. */
export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className={cn(
        controlBase,
        'h-9 w-auto min-w-34 border-border px-2.5 text-[13px]',
        value ? 'text-foreground' : 'text-foreground-muted',
        className
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
