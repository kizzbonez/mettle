import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { QuestionsView } from '@/features/admin/content/questions/questions-view';

export const metadata: Metadata = { title: 'Question bank' };

export default function QuestionsPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <Suspense>
        <QuestionsView />
      </Suspense>
    </AdminGate>
  );
}
