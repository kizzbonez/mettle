import type { Metadata } from 'next';
import { AttemptView } from '@/features/exams/attempt-view';

export const metadata: Metadata = { title: 'Exam attempt' };

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  return <AttemptView attemptId={(await params).id} />;
}
