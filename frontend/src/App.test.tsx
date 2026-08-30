import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: () => <Outlet />,
}));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: () => <Outlet />,
}));

vi.mock('@/pages/chat/ChatPage', () => ({
  ChatPage: () => <h1>Thread chat aktif</h1>,
}));

vi.mock('@/pages/DashboardPage', () => ({
  DashboardPage: () => <h1>Dashboard</h1>,
}));

describe('App chat routes', () => {
  it('keeps a selected conversation on its detail route', async () => {
    render(
      <MemoryRouter initialEntries={['/chat/42']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Thread chat aktif' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
