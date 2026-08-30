import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

/*
  A failure is a state, not an alarm: same panel geometry as EmptyState, with the
  danger tone limited to the icon. Raw exception text never reaches this
  component — callers pass a plain-language message.
*/
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Gagal memuat data',
  message = 'Terjadi kesalahan saat memuat data. Silakan coba lagi.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-12 text-center',
        className
      )}
    >
      <AlertCircle className="h-6 w-6 text-danger" aria-hidden="true" />
      <h3 className="mt-3 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-foreground-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Coba lagi
        </Button>
      )}
    </div>
  );
}
