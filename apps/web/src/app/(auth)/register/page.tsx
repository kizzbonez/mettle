import type { Metadata } from 'next';
import { Notice } from '@/design/patterns/notice';
import { ButtonLink } from '@/design/primitives/button';
import { AuthShell, FormHeading } from '@/features/auth/auth-shell';
import { RegisterForm } from '@/features/auth/register-form';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

export const metadata: Metadata = { title: 'Create an account' };

export default async function RegisterPage() {
  const site = await fetchPublic<SiteInfo>('/public/site');
  const open = site?.registrationOpen ?? true;
  return (
    <AuthShell
      siteName={site?.name ?? 'Mettle'}
      lines={['Read.', 'Build.', 'Prove it.']}
      caption="Lessons, timed exams and hands-on labs across four levels, from first principles to production."
    >
      {open ? (
        <RegisterForm />
      ) : (
        <div className="animate-rise">
          <FormHeading title="Registration is closed">This site is not accepting new sign-ups right now.</FormHeading>
          <Notice>Ask an administrator to create an account for you.</Notice>
          <ButtonLink href="/login" variant="secondary" size="lg" className="mt-6 w-full">Back to sign in</ButtonLink>
        </div>
      )}
    </AuthShell>
  );
}
