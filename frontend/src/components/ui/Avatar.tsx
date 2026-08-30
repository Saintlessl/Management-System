import { cn } from '@/utils';

/*
  Initials on one neutral surface. A per-user colour hash was previously used
  here, which scattered seven accent hues through every table and made real
  status colour harder to spot. Identity is carried by the initials and the
  adjacent name instead.
*/
interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-5.5 w-5.5 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

export function Avatar({ name = '?', src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-medium text-foreground-muted select-none',
        sizeClasses[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Name + initials, the standard identity cell used in tables and lists. */
export function UserCell({
  name,
  secondary,
  size = 'sm',
  className,
}: {
  name?: string | null;
  secondary?: string | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const display = name ?? 'Unassigned';

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar name={display} size={size} />
      <div className="min-w-0">
        <div className={cn('truncate', name ? 'text-foreground' : 'text-foreground-muted/80')}>{display}</div>
        {secondary && <div className="truncate text-xs text-foreground-muted">{secondary}</div>}
      </div>
    </div>
  );
}
