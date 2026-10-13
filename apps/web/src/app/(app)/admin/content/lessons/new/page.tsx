import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { LessonEditor } from '@/features/admin/content/lessons/lesson-editor';

export const metadata: Metadata = { title: 'New lesson' };

export default function NewLessonPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <Suspense>
        <LessonEditor />
      </Suspense>
    </AdminGate>
  );
}
