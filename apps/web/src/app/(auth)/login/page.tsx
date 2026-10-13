import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const site = await fetchPublic<SiteInfo>('/public/site');
  return (
    <AuthShell
      siteName={site?.name ?? 'Mettle'}
      lines={['Tested.', 'Stamped.', 'Proven.']}
      caption="Your code runs against hidden tests in a sandbox. When it passes, the level is yours."
    >
      <Suspense>
        <LoginForm registrationOpen={site?.registrationOpen ?? true} />
      </Suspense>
    </AuthShell>
  );
}
