import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from './types';
import { login as apiLogin, setTokens } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  /** Complete an SSO sign-in from tokens handed back by the IdP callback. */
  completeSso: (access: string, refresh: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  async function login(email: string, password: string): Promise<void> {
    const u = await apiLogin(email, password);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }

  function completeSso(access: string, refresh: string, u: AuthUser): void {
    setTokens(access, refresh);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }

  function logout(): void {
    setTokens(null, null);
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, completeSso, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
