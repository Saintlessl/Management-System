import {
  Bell,
  CheckSquare,
  ClipboardCheck,
  FileClock,
  FolderKanban,
  Key,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Permission slug gating the item; undefined means always visible. */
  permission?: string;
  /** Optional role-only gate; shown only to users with this role. */
  roleOnly?: string;
  end?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/*
  Navigation is declared once and consumed by both the desktop rail and the
  mobile drawer, so the two can never drift. Group titles are labels, not
  headings that need their own container.
*/
export const navGroups: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/projects', label: 'Projects', icon: FolderKanban, permission: 'project.view' },
      { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare, permission: 'task.view' },
      { to: '/approvals', label: 'Approvals', icon: ClipboardCheck, permission: 'task.approve' },
    ],
  },
  {
    title: 'Kolaborasi',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, permission: 'notification.view' },
      { to: '/teams', label: 'Teams', icon: Users, permission: 'team.view' },
    ],
  },
  {
    title: 'Administrasi',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users, permission: 'users.view' },
      { to: '/admin/roles', label: 'Roles', icon: ShieldCheck, permission: 'roles.view' },
      { to: '/admin/permissions', label: 'Permissions', icon: Key, permission: 'permissions.view' },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileClock, permission: 'audit.view' },
    ],
  },
];

export function visibleNavGroups(hasPermission: (slug: string) => boolean, hasRole?: (slug: string) => boolean): NavGroup[] {
  const roleCheck = hasRole ?? (() => true);
  const filtered = navGroups.map((group) => {
    const items = group.items.filter((item) => {
      if (!item.permission) return true;
      if (item.roleOnly && !roleCheck(item.roleOnly)) return false;
      return hasPermission(item.permission);
    });
    return { ...group, items };
  });

  return filtered.filter((group) => group.items.length > 0);
}
