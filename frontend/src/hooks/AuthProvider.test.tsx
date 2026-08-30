import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const authApi = vi.hoisted(() => ({
  getUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/api/auth', () => ({ authApi }));

function SessionHarness() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <span>{isAuthenticated ? 'Signed in' : 'Signed out'}</span>
      <button type="button" onClick={() => void logout().catch(() => undefined)}>
        Logout
      </button>
    </>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authApi.getUser.mockResolvedValue({ data: { id: 1, name: 'Member', email: 'member@example.com', roles: [] } });
  });

  it('clears the local session when the logout request fails', async () => {
    authApi.logout.mockRejectedValue(new Error('Network unavailable'));
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SessionHarness />
      </AuthProvider>,
    );

    expect(await screen.findByText('Signed in')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
  });
});
