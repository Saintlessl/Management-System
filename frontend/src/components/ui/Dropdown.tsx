import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils';

/*
  Overflow menu for row and panel actions. Keeps secondary destructive actions
  out of the row body while remaining keyboard reachable.
*/
interface DropdownProps {
  children: ReactNode;
  label?: string;
  align?: 'left' | 'right';
  trigger?: ReactNode;
}

export function Dropdown({ children, label = 'Aksi lainnya', align = 'right', trigger }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('button,a')?.focus();
    });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted/80 transition-colors duration-150 ease-out',
          'hover:bg-surface-muted hover:text-foreground',
          isOpen && 'bg-surface-muted text-foreground'
        )}
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          onClick={() => setIsOpen(false)}
          className={cn(
            'absolute top-full z-30 mt-1 min-w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg',
            'motion-safe:animate-[menuIn_140ms_var(--ease-out-quart)]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  tone = 'default',
  disabled,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-out',
        'disabled:pointer-events-none disabled:opacity-50',
        tone === 'danger'
          ? 'text-danger hover:bg-danger/10'
          : 'text-foreground hover:bg-input hover:text-foreground'
      )}
    >
      {icon && <span className="shrink-0 text-current opacity-70">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-surface-muted" role="separator" />;
}
