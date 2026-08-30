import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Row range summary, when the API reports it. */
  total?: number;
  from?: number | null;
  to?: number | null;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  from,
  to,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginasi"
      className={cn(
        'flex items-center justify-between gap-3 border-t border-border px-4 py-2.5',
        className
      )}
    >
      <p className="text-xs text-foreground-muted">
        {total !== undefined && from != null && to != null ? (
          <>
            Menampilkan <span className="font-medium text-foreground tabular-nums">{from}</span>–
            <span className="font-medium text-foreground tabular-nums">{to}</span> dari{' '}
            <span className="font-medium text-foreground tabular-nums">{total}</span>
          </>
        ) : (
          <>
            Halaman <span className="font-medium text-foreground tabular-nums">{currentPage}</span>{' '}
            dari <span className="font-medium text-foreground tabular-nums">{totalPages}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-1 text-xs font-medium text-foreground-muted tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
