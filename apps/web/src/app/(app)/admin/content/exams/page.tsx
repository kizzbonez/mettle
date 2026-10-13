import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { ExamsView } from '@/features/admin/content/exams/exams-view';

export const metadata: Metadata = { title: 'Exams' };

export default function ExamsPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <ExamsView />
    </AdminGate>
  );
}
