import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { ExamEditor } from '@/features/admin/content/exams/exam-editor';

export const metadata: Metadata = { title: 'New exam' };

export default function NewExamPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <ExamEditor />
    </AdminGate>
  );
}
