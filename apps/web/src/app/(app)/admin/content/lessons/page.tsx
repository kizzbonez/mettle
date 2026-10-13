import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { LessonsView } from '@/features/admin/content/lessons/lessons-view';

export const metadata: Metadata = { title: 'Lessons' };

export default function LessonsPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <Suspense>
        <LessonsView />
      </Suspense>
    </AdminGate>
  );
}
