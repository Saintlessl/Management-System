import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Form dialogs should not be cramped: md is 560px, lg 640px, xl 880px. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Sticky action row. Keeps Cancel/Save visible while a long form scrolls. */
  footer?: ReactNode;
}

const sizes = {
  sm: 'max-w-[27.5rem]',
  md: 'max-w-[35rem]',
  lg: 'max-w-[40rem]',
  xl: 'max-w-[55rem]',
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Remember what had focus so it can be handed back on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      // Keep Tab inside the dialog while it is open.
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    window.requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      // Prefer the first real control; fall back to the dialog itself.
      (focusable && focusable.length > 0 ? focusable[0] : dialogRef.current)?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 pt-[8vh] motion-safe:animate-[fadeIn_160ms_ease-out] sm:p-6 sm:pt-[10vh]"
      onMouseDown={(event) => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'flex max-h-[84vh] w-full flex-col rounded-xl border border-border bg-surface shadow-xl outline-none',
          'motion-safe:animate-[dialogIn_180ms_var(--ease-out-quart)]',
          sizes[size]
        )}
      >
        {title && (
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-foreground">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-0.5 text-[13px] text-foreground-muted">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="-mr-1.5 -mt-1 text-foreground-muted/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border bg-input/60 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
