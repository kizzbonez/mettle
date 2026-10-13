import type { PublishStatus } from '@mettle/shared';
import type { AdminLesson } from '@/types/content-admin';
import { toInt, toLines } from '../shared/labels';

export const LESSONS = '/admin/content/lessons';

/** What the delete confirmation says goes with a lesson. */
export const LESSON_DELETE_NOTE =
  'The lesson is removed from its course, along with the record of which learners completed it. Course progress is then counted without it.';

/** The lesson form as typed: numbers are text until they are sent, objectives are one per line. */
export const blankLesson = {
  courseId: '',
  slug: '',
  title: '',
  summary: '',
  objectives: '',
  bodyMd: '',
  estMinutes: '15',
  status: 'draft' as PublishStatus,
  sortOrder: '0',
};

export type LessonFormState = typeof blankLesson;

export const LESSON_FIELDS = Object.keys(blankLesson);

export function lessonFormOf(lesson: AdminLesson): LessonFormState {
  return {
    courseId: lesson.courseId,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    objectives: lesson.objectives.join('\n'),
    bodyMd: lesson.bodyMd,
    estMinutes: String(lesson.estMinutes),
    status: lesson.status,
    sortOrder: String(lesson.sortOrder),
  };
}

/** The request body. Always the whole lesson: a field left out of a PATCH is reset to its default by the API. */
export function lessonBodyOf(form: LessonFormState) {
  return { ...form, objectives: toLines(form.objectives), estMinutes: toInt(form.estMinutes), sortOrder: toInt(form.sortOrder) };
}
