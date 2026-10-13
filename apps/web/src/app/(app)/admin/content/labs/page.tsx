import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { LabsView } from '@/features/admin/content/labs/labs-view';

export const metadata: Metadata = { title: 'Labs' };

export default function LabsPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <LabsView />
    </AdminGate>
  );
}
