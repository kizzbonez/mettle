import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/features/auth/auth-shell';
import { SetupWizard } from '@/features/setup/setup-wizard';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

export const metadata: Metadata = { title: 'Set up Mettle', robots: { index: false } };

/** First-run only. Once an administrator exists this page sends everyone to sign in. */
export default async function SetupPage() {
  const site = await fetchPublic<SiteInfo>('/public/site');
  if (site && !site.setupNeeded) redirect('/login');
  return (
    <AuthShell
      siteName="Mettle"
      lines={['Five', 'steps to', 'first light.']}
      caption="You are the first person here. This sets up the administrator account, turns on two-factor sign-in, and opens the doors."
    >
      {site ? <SetupWizard /> : <p className="text-steel">The API is not reachable yet. Check that it is running, then reload this page.</p>}
    </AuthShell>
  );
}
