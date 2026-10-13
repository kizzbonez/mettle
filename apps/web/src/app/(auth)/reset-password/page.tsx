import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/auth-shell';
import { ResetPasswordForm } from '@/features/auth/recovery-forms';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

export const metadata: Metadata = { title: 'Choose a new password', referrer: 'no-referrer' };

export default async function ResetPasswordPage() {
  const site = await fetchPublic<SiteInfo>('/public/site');
  return (
    <AuthShell
      siteName={site?.name ?? 'Mettle'}
      lines={['New', 'password.', 'Same progress.']}
      caption="Choosing a new password signs every device out, so anyone who had the old one is gone."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
