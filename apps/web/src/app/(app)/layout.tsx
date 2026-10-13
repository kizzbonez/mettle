import type { ReactNode } from 'react';
import { ToastProvider } from '@/design/primitives/toast';
import { AuthProvider } from '@/features/auth/auth-provider';
import { AppShell } from '@/features/shell/app-shell';

/** Every page in this group needs a session; AuthProvider enforces it. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </AuthProvider>
  );
}
