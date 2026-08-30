import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Actions, aligned opposite the title. */
  children?: ReactNode;
  className?: string;
}

/*
  Restrained page header: 24px title, one line of supporting copy, actions on the
  right. Breadcrumbs use router links so in-app navigation does not full-reload.
*/
export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-foreground-muted">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 shrink-0 text-border" aria-hidden="true" />
                  )}
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="rounded transition-colors hover:text-foreground hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 max-w-3xl text-sm text-foreground-muted">{description}</p>}
      </div>

      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
