import type { Metadata } from 'next';
import { ExamOverview } from '@/features/exams/exam-overview';

export const metadata: Metadata = { title: 'Exam' };

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamOverview examId={(await params).id} />;
}
