import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import type { User } from '@/types';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getUser();
      setUser(response.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.getUser();
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    const clearUnauthorizedUser = () => setUser(null);

    initAuth();
    window.addEventListener('auth:unauthorized', clearUnauthorizedUser);

    return () => window.removeEventListener('auth:unauthorized', clearUnauthorizedUser);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.data);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      // The local session must end even if the backend is temporarily unreachable.
      setUser(null);
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.roles) return false;
    if (user.roles.some((role) => role.slug === 'super-admin')) return true;
    return user.roles.some((role) => role.permissions?.some((item) => item.slug === permission));
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.some((item) => item.slug === role) ?? false;
  }, [user]);

  const isSuperAdmin = user?.roles?.some((role) => role.slug === 'super-admin') ?? false;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      hasPermission,
      hasRole,
      isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
