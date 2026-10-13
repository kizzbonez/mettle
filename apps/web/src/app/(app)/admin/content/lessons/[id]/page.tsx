import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { LessonEditor } from '@/features/admin/content/lessons/lesson-editor';

export const metadata: Metadata = { title: 'Edit lesson' };

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <Suspense>
        <LessonEditor lessonId={id} />
      </Suspense>
    </AdminGate>
  );
}
