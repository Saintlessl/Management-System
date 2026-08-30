import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  hasPermission: vi.fn(() => false),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

function renderRoutes(initialPath = '/private', permission?: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/forbidden" element={<div>Forbidden page</div>} />
        <Route element={<ProtectedRoute permission={permission} />}>
          <Route path="/private" element={<div>Private page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.hasPermission.mockReturnValue(false);
  });

  it('shows a loading state until authentication bootstrap finishes', () => {
    authState.isLoading = true;
    renderRoutes();
    expect(screen.getByLabelText('Memuat sesi')).toBeInTheDocument();
  });

  it('redirects guests to login', () => {
    renderRoutes();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects unauthorized users to forbidden', () => {
    authState.isAuthenticated = true;
    renderRoutes('/private', 'users.view');
    expect(screen.getByText('Forbidden page')).toBeInTheDocument();
  });

  it('renders the protected page with permission', () => {
    authState.isAuthenticated = true;
    authState.hasPermission.mockReturnValue(true);
    renderRoutes('/private', 'users.view');
    expect(screen.getByText('Private page')).toBeInTheDocument();
  });
});
