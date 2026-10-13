import type { Metadata } from 'next';
import { LessonView } from '@/features/lessons/lesson-view';

export const metadata: Metadata = { title: 'Lesson' };

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  return <LessonView lessonId={(await params).id} />;
}
