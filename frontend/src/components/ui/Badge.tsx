import { cn } from '@/utils';

/*
  Status vocabulary.

  Colour is spent only where it carries meaning: neutral for "not started",
  the blue accent for "in flight", amber for "needs a decision", emerald for
  "finished", rose for "wrong". Backlog/Todo/Low/Medium deliberately stay
  neutral — colouring every value is what turns a table into noise.
*/
type Tone = 'neutral' | 'accent' | 'warning' | 'success' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-foreground border-border',
  accent: 'bg-primary-subtle text-primary border-primary-border',
  // Status tints stay derived from their semantic tokens so client themes
  // cannot wash out their meaning.
  warning: 'bg-warning/10 text-warning border-warning/25',
  success: 'bg-success/10 text-success border-success/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
};

const dotTones: Record<Tone, string> = {
  neutral: 'bg-foreground-muted',
  accent: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-danger',
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotTones[tone])} />}
      {children}
    </span>
  );
}

const statusMeta: Record<string, { tone: Tone; label: string }> = {
  // Project lifecycle
  planning: { tone: 'neutral', label: 'Planning' },
  active: { tone: 'accent', label: 'Active' },
  on_hold: { tone: 'warning', label: 'On Hold' },
  completed: { tone: 'success', label: 'Completed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  // Task lifecycle
  backlog: { tone: 'neutral', label: 'Backlog' },
  todo: { tone: 'neutral', label: 'To Do' },
  in_progress: { tone: 'accent', label: 'In Progress' },
  review: { tone: 'warning', label: 'Review' },
  done: { tone: 'success', label: 'Done' },
  // Approval lifecycle
  pending: { tone: 'warning', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
  revision_required: { tone: 'warning', label: 'Revision Required' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = statusMeta[status] ?? { tone: 'neutral' as Tone, label: status.replaceAll('_', ' ') };
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}

const priorityMeta: Record<string, { tone: Tone; label: string }> = {
  low: { tone: 'neutral', label: 'Low' },
  medium: { tone: 'neutral', label: 'Medium' },
  high: { tone: 'warning', label: 'High' },
  critical: { tone: 'danger', label: 'Critical' },
};

/*
  Priority reads as a rank, so it uses a bar glyph rather than a status dot —
  that keeps it visually distinct from status in a dense table row, and the
  filled-segment count encodes the rank without relying on colour alone.
*/
const priorityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const meta = priorityMeta[priority] ?? { tone: 'neutral' as Tone, label: priority };
  const rank = priorityRank[priority] ?? 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
        meta.tone === 'danger'
          ? 'text-danger'
          : meta.tone === 'warning'
            ? 'text-warning'
            : 'text-foreground-muted',
        className
      )}
    >
      <span className="flex items-end gap-px" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              'w-0.5 rounded-full',
              step === 1 ? 'h-1.5' : step === 2 ? 'h-2' : 'h-2.5',
              // Critical fills every segment; low fills only the first.
              (rank >= 4 ? true : rank >= step)
                ? meta.tone === 'danger'
                  ? 'bg-danger'
                  : meta.tone === 'warning'
                    ? 'bg-warning'
                    : 'bg-foreground-muted'
                : 'bg-border'
            )}
          />
        ))}
      </span>
      {meta.label}
    </span>
  );
}
