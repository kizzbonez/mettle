import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { TracksView } from '@/features/admin/content/tracks/tracks-view';

export const metadata: Metadata = { title: 'Tracks & courses' };

export default function TracksPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <TracksView />
    </AdminGate>
  );
}
