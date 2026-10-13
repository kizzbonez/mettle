import type { Metadata } from 'next';
import { CourseView } from '@/features/courses/course-view';

export const metadata: Metadata = { title: 'Course' };

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  return <CourseView courseId={(await params).id} />;
}
