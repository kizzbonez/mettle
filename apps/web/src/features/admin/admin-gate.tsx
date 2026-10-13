'use client';

import type { Role } from '@mettle/shared';
import { Lock, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/design/patterns/notice';
import { ButtonLink } from '@/design/primitives/button';
import { useAuth } from '@/features/auth/auth-provider';

/**
 * Explains, rather than hides, why a page will not open. The API refuses the
 * requests either way; this is so the person knows what to do next.
 */
export function AdminGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!allow.includes(user.role)) {
    return (
      <EmptyState icon={<Lock className="size-5" />} title="This area is for staff" action={<ButtonLink href="/dashboard" variant="secondary">Back to your dashboard</ButtonLink>}>
        Your account does not have access to this page.
      </EmptyState>
    );
  }
  if (user.mustEnrollTotp) {
    return (
      <EmptyState icon={<ShieldAlert className="size-5" />} title="Set up two-factor authentication first" action={<ButtonLink href="/profile?tab=security">Set it up now</ButtonLink>}>
        Administrator accounts can change everything on this site, so they sign in with a password and a code. It takes about a minute.
      </EmptyState>
    );
  }
  return <>{children}</>;
}
