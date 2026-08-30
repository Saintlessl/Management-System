import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextType } from '@/hooks/authContext';
import { LoginPage } from './LoginPage';

function renderLogin(login: AuthContextType['login']) {
  const value: AuthContextType = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login,
    logout: vi.fn(),
    refreshUser: vi.fn(),
    hasPermission: () => false,
    hasRole: () => false,
    isSuperAdmin: false,
  };

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={value}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('distinguishes an unreachable backend from invalid credentials', async () => {
    const response = { status: 502, data: '', headers: {}, statusText: 'Bad Gateway', config: {} } as AxiosResponse;
    const login = vi.fn().mockRejectedValue(new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE', undefined, undefined, response));
    const user = userEvent.setup();
    renderLogin(login);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'Admin12345');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend Laravel tidak tersambung');
  });

  it('renders readable light form controls regardless of system theme', () => {
    renderLogin(vi.fn());

    expect(screen.getByLabelText('Email')).toHaveClass('bg-surface', 'text-foreground', 'caret-primary');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('presents the product workflow and a task-focused sign-in hierarchy', () => {
    renderLogin(vi.fn());

    expect(screen.getByRole('heading', { name: 'Masuk ke ProManage' })).toBeInTheDocument();
    expect(screen.getByTestId('login-brand-panel')).toBeInTheDocument();
    expect(screen.getByText('Proyek & tugas')).toBeInTheDocument();
    expect(screen.getByText('Alur persetujuan')).toBeInTheDocument();
    expect(screen.getByText('Kolaborasi tim')).toBeInTheDocument();
  });
});
