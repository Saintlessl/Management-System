import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, FileClock, FolderKanban, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

export function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navigation = [
    { to: '/', label: 'Beranda', icon: LayoutDashboard, visible: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban, visible: hasPermission('project.view') },
    { to: '/notifications', label: 'Notifications', icon: Bell, visible: hasPermission('notification.view') },
    { to: '/admin/users', label: 'Pengguna', icon: Users, visible: hasPermission('users.view') },
    { to: '/admin/roles', label: 'Roles', icon: ShieldCheck, visible: hasPermission('roles.view') },
    { to: '/admin/permissions', label: 'Permissions', icon: ShieldCheck, visible: hasPermission('permissions.view') },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileClock, visible: hasPermission('audit.view') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-bold text-slate-900">Management System</p>
            <p className="text-xs text-slate-500">Administration workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Navigasi utama">
          {navigation.filter((item) => item.visible).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => cn(
                  'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
