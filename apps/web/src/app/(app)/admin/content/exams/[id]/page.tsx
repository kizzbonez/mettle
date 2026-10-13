import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { ExamEditor } from '@/features/admin/content/exams/exam-editor';

export const metadata: Metadata = { title: 'Edit exam' };

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <ExamEditor examId={id} />
    </AdminGate>
  );
}
