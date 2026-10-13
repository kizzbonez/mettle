'use client';

import { useSearchParams } from 'next/navigation';
import type { AdminLesson } from '@/types/content-admin';
import { EditorLoad } from '../shared/form-layout';
import { useCourses } from '../shared/use-catalog';
import { useEditable } from '../shared/use-editor';
import { LessonForm } from './lesson-form';
import { LESSONS } from './lesson-model';

/** The lesson editor page: loads the lesson (when there is one) and the courses it can belong to. */
export function LessonEditor({ lessonId }: { lessonId?: string }) {
  const params = useSearchParams();
  const item = useEditable<{ lesson: AdminLesson }>(lessonId ? `/admin/lessons/${lessonId}` : null);
  const catalog = useCourses();
  const lesson = item.data?.lesson ?? null;
  const ready = catalog.courses && (!lessonId || lesson) ? { courses: catalog.courses } : undefined;
  const retry = () => {
    void item.mutate();
    void catalog.mutate();
  };

  return (
    <EditorLoad data={ready} error={item.error ?? catalog.error} onRetry={retry} what="lesson" back={{ href: LESSONS, label: 'Back to lessons' }}>
      {({ courses }) => (
        <LessonForm key={lessonId ?? 'new'} lesson={lesson} courses={courses} startCourseId={params.get('courseId') ?? ''} onSaved={() => item.mutate()} />
      )}
    </EditorLoad>
  );
}
