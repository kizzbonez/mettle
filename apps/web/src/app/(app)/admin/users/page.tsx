import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { UsersView } from '@/features/admin/users/users-view';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <AdminGate allow={['admin']}>
      <Suspense>
        <UsersView />
      </Suspense>
    </AdminGate>
  );
}
