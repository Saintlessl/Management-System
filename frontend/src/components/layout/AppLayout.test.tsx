import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

const state = vi.hoisted(() => ({ permissions: new Set<string>(), roles: new Set<string>(), logout: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { name: 'Member', email: 'member@example.com' }, logout: state.logout, hasPermission: (permission: string) => state.permissions.has(permission), hasRole: (role: string) => state.roles.has(role) }) }));

// The shell reads the live unread count for the bell badge; stub the request.
vi.mock('@/api/operations', () => ({
  operationsApi: { unreadCount: vi.fn().mockResolvedValue({ success: true, message: '', data: { count: 0 } }) },
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => <button type="button" aria-label="Open Tanstack query devtools" />,
}));

describe('AppLayout navigation', () => {
  beforeEach(() => {
    state.permissions.clear();
    vi.clearAllMocks();
  });

  it('shows only routes allowed by permissions', () => {
    state.permissions.add('project.view'); state.permissions.add('task.view'); state.permissions.add('task.approve'); state.permissions.add('notification.view');
    render(wrap(<AppLayout />));
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notifikasi/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit Logs' })).not.toBeInTheDocument();
  });

  it('hides unauthorized navigation groups entirely', () => {
    state.permissions.add('project.view');
    render(wrap(<AppLayout />));
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    // No notification permission → no bell link.
    expect(screen.queryByRole('link', { name: /Notifikasi/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My Tasks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Approvals' })).not.toBeInTheDocument();
  });

  it('replaces the horizontal Chat menu with a round floating launcher', async () => {
    state.permissions.add('chat.view');
    render(wrap(<AppLayout />));

    expect(screen.queryByRole('link', { name: 'Chat' })).not.toBeInTheDocument();

    const launcher = screen.getByRole('button', { name: 'Buka team chat' });
    expect(launcher).toHaveClass('rounded-full', 'h-[50px]', 'w-[50px]', 'sm:h-14', 'sm:w-14');
    expect(launcher.parentElement).toHaveClass('fixed', 'bottom-4', 'right-4', 'sm:bottom-6', 'sm:right-6');

    await userEvent.click(launcher);

    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tutup chat' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('stacks TanStack Query Devtools immediately above the chat bubble', () => {
    state.permissions.add('chat.view');
    render(wrap(<AppLayout />));

    const devtoolsDock = screen.getByTestId('query-devtools-above-chat');
    const launcher = screen.getByRole('button', { name: 'Buka team chat' });

    expect(devtoolsDock).toContainElement(screen.getByRole('button', { name: 'Open Tanstack query devtools' }));
    expect(devtoolsDock.nextElementSibling).toBe(launcher);
  });

  it('keeps the floating chat launcher behind the existing chat permission', () => {
    render(wrap(<AppLayout />));

    expect(screen.queryByRole('button', { name: 'Buka team chat' })).not.toBeInTheDocument();
  });

  it('uses the branded navigation rail and keeps a compact mobile identity', () => {
    render(wrap(<AppLayout />));

    expect(screen.getByTestId('desktop-sidebar')).toHaveClass('bg-sidebar', 'text-sidebar-foreground');
    expect(screen.getByRole('link', { name: 'ProManage — Dashboard mobile' })).toBeInTheDocument();
  });
});

function wrap(children: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}
