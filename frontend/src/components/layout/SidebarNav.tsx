import { NavLink } from 'react-router-dom';
import { cn } from '@/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import type { NavGroup } from './navigation';

interface SidebarNavProps {
  groups: NavGroup[];
  /** Icon-only rail. Labels move into tooltips. */
  collapsed?: boolean;
  onNavigate?: () => void;
}

/*
  Navigation rows are 36px, with a soft accent-tinted active state — readable
  without turning each row into a saturated pill. The active row also carries a
  left marker so it stays identifiable when the rail is collapsed.
*/
export function SidebarNav({ groups, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <div className={cn('flex flex-col gap-5', collapsed ? 'px-2' : 'px-3')}>
      {groups.map((group) => (
        <div key={group.title}>
          {collapsed ? (
            <div className="mx-2 mb-2 h-px bg-white/10" role="presentation" />
          ) : (
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.12em] text-sidebar-muted/70 uppercase">
              {group.title}
            </p>
          )}

          <nav aria-label={group.title} className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;

              const link = (
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-10 items-center gap-2.5 rounded-xl text-[13px] font-medium',
                      'transition-colors duration-150 ease-out',
                      collapsed ? 'w-full justify-center px-0' : 'px-2.5',
                      isActive
                        ? 'bg-white/10 text-sidebar-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                        : 'text-sidebar-muted hover:bg-white/6 hover:text-sidebar-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.55)]"
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-indigo-300' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
                        )}
                        aria-hidden="true"
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.to} label={item.label}>
                  {link}
                </Tooltip>
              ) : (
                <div key={item.to}>{link}</div>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
