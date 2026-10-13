'use client';

import type { ExamDetail } from '@/types/content-admin';
import { EditorLoad } from '../shared/form-layout';
import { useCategories, useCourses, useTracks } from '../shared/use-catalog';
import { useEditable } from '../shared/use-editor';
import { ExamFormView } from './exam-form';
import { EXAMS } from './exam-model';

/** The exam editor page: loads the exam (when there is one) and the lists its fields choose from. */
export function ExamEditor({ examId }: { examId?: string }) {
  const item = useEditable<ExamDetail>(examId ? `/admin/exams/${examId}` : null);
  const tracks = useTracks();
  const courses = useCourses();
  const categories = useCategories();
  const lists = tracks.tracks && courses.courses && categories.categories
    ? { tracks: tracks.tracks, courses: courses.courses, categories: categories.categories }
    : undefined;
  const ready = lists && (!examId || item.data) ? lists : undefined;
  const retry = () => {
    void item.mutate();
    void tracks.mutate();
    void courses.mutate();
    void categories.mutate();
  };

  return (
    <EditorLoad data={ready} error={item.error ?? tracks.error ?? courses.error ?? categories.error} onRetry={retry} what="exam" back={{ href: EXAMS, label: 'Back to exams' }}>
      {(loaded) => <ExamFormView key={examId ?? 'new'} detail={item.data ?? null} {...loaded} onSaved={() => item.mutate()} />}
    </EditorLoad>
  );
}
