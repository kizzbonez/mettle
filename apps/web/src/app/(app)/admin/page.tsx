import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { OverviewView } from '@/features/admin/overview-view';

export const metadata: Metadata = { title: 'Admin overview' };

export default function AdminPage() {
  return (
    <AdminGate allow={['admin']}>
      <OverviewView />
    </AdminGate>
  );
}
