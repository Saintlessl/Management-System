import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { operationsApi } from '@/api/operations';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/utils';
import { SidebarNav } from './SidebarNav';
import { visibleNavGroups } from './navigation';
import { TeamChatBubble } from '@/components/chat/TeamChatBubble';

const SIDEBAR_STORAGE_KEY = 'promanage:sidebar-collapsed';

/*
  Application shell.

  Sidebar (256px expanded / 68px collapsed) is a full-height sticky rail with the
  brand, navigation, and the user identity + logout pinned at the bottom. The
  topbar carries context controls: search shortcut, quick-create, and a
  notification bell with a live unread badge. The main column takes the remaining
  width with no max-width wrapper.
*/
export function AppLayout() {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const groups = visibleNavGroups(hasPermission, hasRole);

  // Live unread badge for the bell; polls lightly so the count stays honest.
  const canSeeNotifications = hasPermission('notification.view');
  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: operationsApi.unreadCount,
    enabled: canSeeNotifications,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const unreadCount = unread?.data?.count ?? 0;

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // A blocked storage write should not break navigation.
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const userBlock = (
    <div className={cn('flex min-w-0 items-center gap-2.5', isCollapsed ? 'justify-center' : 'flex-1')}>
      <Avatar
        name={user?.name}
        size="sm"
        className="bg-white/10 text-sidebar-foreground ring-1 ring-white/10"
      />
      {!isCollapsed && (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-sidebar-foreground">{user?.name ?? 'Pengguna'}</p>
          <p className="truncate text-[11px] text-sidebar-muted">{user?.email}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>

      {/* Desktop rail */}
      <aside
        data-testid="desktop-sidebar"
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-white/8 bg-sidebar text-sidebar-foreground shadow-[12px_0_40px_-32px_rgba(17,22,44,0.9)] lg:flex',
          'transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-18' : 'w-60'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/8',
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
          )}
        >
          <Link
            to="/"
            className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
            aria-label="ProManage — Dashboard"
          >
            P
          </Link>
          {!isCollapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[14px] font-semibold tracking-tight text-sidebar-foreground">
                ProManage
              </span>
              <span className="mt-0.5 block truncate text-[10px] tracking-wide text-sidebar-muted">
                PROJECT WORKSPACE
              </span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-5">
          <SidebarNav groups={groups} collapsed={isCollapsed} />
        </div>

        {/* Identity + session control live here so they survive collapse as icons. */}
        <div
          className={cn(
            'shrink-0 border-t border-white/8 py-3',
            isCollapsed ? 'px-2' : 'px-3'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-1',
              isCollapsed ? 'flex-col' : ''
            )}
          >
            <Tooltip label={user?.name ?? 'Pengguna'} side="right">
              {userBlock}
            </Tooltip>
            <Tooltip label="Keluar" side="right">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar dari akun"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-muted',
                  'transition-colors duration-150 ease-out hover:bg-danger/15 hover:text-red-300'
                )}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!isCollapsed}
              className={cn(
                'mt-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-1 text-[12px] font-medium text-sidebar-muted',
                'transition-colors duration-150 ease-out hover:bg-white/7 hover:text-sidebar-foreground'
              )}
            >
              <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Ciutkan</span>
              <span className="sr-only">Ciutkan sidebar</span>
            </button>
          )}
          {isCollapsed && (
            <div className="mt-1 flex justify-center">
              <Tooltip label="Perluas sidebar" side="right">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-expanded={!isCollapsed}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-muted transition-colors duration-150 ease-out hover:bg-white/7 hover:text-sidebar-foreground"
                >
                  <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Perluas sidebar</span>
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 motion-safe:animate-[fadeIn_160ms_ease-out]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r border-white/8 bg-sidebar text-sidebar-foreground shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-4">
              <span className="flex items-center gap-2.5">
                <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white">
                  P
                </span>
                <span>
                  <span className="block text-sm font-semibold tracking-tight">ProManage</span>
                  <span className="block text-[10px] text-sidebar-muted">Project workspace</span>
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Tutup navigasi"
                className="text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-5">
              <SidebarNav groups={groups} onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="border-t border-white/8 p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center border-white/10 bg-white/5 text-red-300 hover:bg-danger/15 hover:text-red-200"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-surface/85 px-4 shadow-[0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-10 w-10 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Buka navigasi"
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>

          <Link
            to="/"
            aria-label="ProManage — Dashboard mobile"
            className="flex min-w-0 items-center gap-2.5 lg:hidden"
          >
            <span className="brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white">P</span>
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">ProManage</span>
          </Link>

          {/*
            Search is presented as a control that routes to the project list —
            the API has no cross-entity search endpoint, so a live global search
            field here would be a dead input.
          */}
          {hasPermission('project.view') && (
            <Link
              to="/projects"
              className="hidden h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-input/80 px-3 text-[13px] text-foreground-muted transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-primary-border hover:bg-surface hover:shadow-sm md:flex"
            >
              <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Cari proyek...</span>
            </Link>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {hasPermission('project.create') && (
              <Link to="/projects?new=1" className="hidden sm:inline-flex">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Proyek baru
                </Button>
              </Link>
            )}

            {canSeeNotifications && (
              <Tooltip label="Notifikasi" side="top">
                <Link
                  to="/notifications"
                  aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground-muted transition-colors duration-150 ease-out hover:bg-primary-subtle hover:text-primary"
                >
                  <Bell className="h-4.5 w-4.5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span
                      className={cn(
                        'absolute -top-0.5 right-0 flex min-w-4.5 justify-center rounded-full bg-primary px-1 py-px',
                        'text-[10px] font-semibold leading-none text-primary-foreground tabular-nums'
                      )}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Tooltip>
            )}
          </div>
        </header>

        <main
          id="main-content"
          className="workspace-canvas w-full min-w-0 flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-7 sm:pb-28 lg:px-8 lg:py-8"
        >
          {/*
            Keyed by pathname so the entrance animation replays on every
            navigation — a single 180ms fade-and-rise, nothing per-element.
          */}
          <div
            key={location.pathname}
            className="mx-auto w-full max-w-[96rem] motion-safe:animate-[pageIn_180ms_var(--ease-out-quart)]"
          >
            <Outlet />
          </div>
        </main>
        {hasPermission('chat.view') && <TeamChatBubble />}
      </div>
    </div>
  );
}
