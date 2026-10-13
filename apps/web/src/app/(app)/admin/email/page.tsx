import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { EmailLogView } from '@/features/admin/email-and-settings';

export const metadata: Metadata = { title: 'Email' };

export default function EmailPage() {
  return (
    <AdminGate allow={['admin']}>
      <Suspense>
        <EmailLogView />
      </Suspense>
    </AdminGate>
  );
}
