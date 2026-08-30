import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const tabBase =
  'inline-flex items-center gap-2 border-b-2 px-0.5 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ease-out';

function tabState(isActive: boolean) {
  return isActive
    ? 'border-primary text-foreground'
    : 'border-transparent text-foreground-muted hover:border-primary-border hover:text-foreground';
}

function TabCount({ count, isActive }: { count: number; isActive: boolean }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
        isActive ? 'bg-primary-subtle text-primary' : 'bg-surface-muted text-foreground-muted'
      )}
    >
      {count}
    </span>
  );
}

/** In-page tabs for state that does not have its own route. */
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-border', className)}>
      <nav className="-mb-px flex gap-5 overflow-x-auto" aria-label="Tab">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(tabBase, tabState(isActive))}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
              {tab.label}
              {tab.count !== undefined && <TabCount count={tab.count} isActive={isActive} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface RouteTab {
  to: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  end?: boolean;
}

/**
 * Tabs backed by routes — used for the project workspace (Overview / Tasks /
 * Kanban / Members / Labels) so each view is linkable and the back button works.
 */
export function RouteTabs({ tabs, className }: { tabs: RouteTab[]; className?: string }) {
  return (
    <div className={cn('border-b border-border', className)}>
      <nav className="-mb-px flex gap-5 overflow-x-auto" aria-label="Tab halaman">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="shrink-0">
              {({ isActive }) => (
                <span className={cn(tabBase, tabState(isActive))}>
                  {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {tab.label}
                  {tab.count !== undefined && <TabCount count={tab.count} isActive={isActive} />}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
