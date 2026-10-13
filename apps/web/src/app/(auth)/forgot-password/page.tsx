import type { Metadata } from 'next';
import { AuthShell } from '@/features/auth/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/recovery-forms';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

export const metadata: Metadata = { title: 'Forgot password' };

export default async function ForgotPasswordPage() {
  const site = await fetchPublic<SiteInfo>('/public/site');
  return (
    <AuthShell
      siteName={site?.name ?? 'Mettle'}
      lines={['Locked', 'out?', 'Not for long.']}
      caption="Reset links are single-use and expire after an hour. Your progress stays exactly where you left it."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
