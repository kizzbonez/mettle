'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { PageSpinner } from '@/design/primitives/spinner';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { SessionUser } from '@/types/account';

interface AuthContextValue {
  user: SessionUser;
  /** Re-reads the account after it changed (name, two-factor). */
  refresh: () => Promise<unknown>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Wraps every signed-in page. It loads the account once, and if the session
 * turns out to be gone (the API answers 401 even after a refresh attempt) it
 * sends the visitor to sign in and brings them back afterwards.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, mutate } = useApi<{ user: SessionUser }>('/auth/me');

  useEffect(() => {
    if (error?.status === 401) window.location.assign(`/login?next=${encodeURIComponent(pathname)}`);
  }, [error, pathname]);

  const signOut = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    await mutate(undefined, { revalidate: false });
    router.replace('/login');
    router.refresh();
  }, [mutate, router]);

  const value = useMemo<AuthContextValue | null>(
    () => (data ? { user: data.user, refresh: () => mutate(), signOut } : null),
    [data, mutate, signOut],
  );

  if (!value) return <PageSpinner label={error && error.status !== 401 ? 'Reconnecting' : 'Loading your account'} />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
