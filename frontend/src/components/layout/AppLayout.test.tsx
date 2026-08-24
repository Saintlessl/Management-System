import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

const state = vi.hoisted(() => ({ permissions: new Set<string>(), logout: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { name: 'Member', email: 'member@example.com' }, logout: state.logout, hasPermission: (permission: string) => state.permissions.has(permission) }) }));

describe('AppLayout navigation', () => {
  beforeEach(() => state.permissions.clear());
  it('shows only routes allowed by permissions', () => {
    state.permissions.add('project.view'); state.permissions.add('notification.view');
    render(<MemoryRouter><AppLayout /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit Logs' })).not.toBeInTheDocument();
  });
});
