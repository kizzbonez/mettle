import type { ReactNode } from 'react';
import { ToastProvider } from '@/design/primitives/toast';
import { AuthProvider } from '@/features/auth/auth-provider';

/** The lab workspace takes the whole screen, so it has a session but no sidebar. */
export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
