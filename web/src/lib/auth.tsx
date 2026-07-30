import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { api, getStoredUser, setSession } from '../lib/api';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  loginDemo: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      setLoading(false);
      return;
    }
    api<User>('/auth/me')
      .then((me) => {
        setUser(me);
        setSession(localStorage.getItem('token'), me);
      })
      .catch(() => {
        setSession(null, null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, senha) {
        const res = await api<{ token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha }),
        });
        setSession(res.token, res.user);
        setUser(res.user);
      },
      loginDemo(u) {
        setSession(null, u);
        setUser(u);
      },
      logout() {
        setSession(null, null);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
