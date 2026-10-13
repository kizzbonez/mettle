'use client';

import { plural } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { AdminCourse, AdminTrack, ExamRow, LessonRow } from '@/types/content-admin';
import { ConfirmDelete, DeletedWith } from '../shared/confirm-delete';

interface DialogProps {
  onClose: () => void;
  onDone: () => void;
}

/** "its 3 lessons" once the count is known, "its lessons" until then, nothing when there are none. */
function its(count: number | undefined, one: string): string | null {
  if (count === undefined) return `its ${one}s`;
  if (count === 0) return null;
  return count === 1 ? `its ${one}` : `its ${count} ${one}s`;
}

const sentence = (parts: (string | null)[]) => parts.filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1');

export function DeleteTrackDialog({ track, courses, onClose, onDone }: DialogProps & { track: AdminTrack | null; courses: AdminCourse[] }) {
  const { data } = useApi<{ exams: ExamRow[] }>(track ? '/admin/exams' : null);
  const exams = track ? data?.exams.filter((exam) => exam.trackId === track.id).length : undefined;
  const levels = courses.length;
  return (
    <ConfirmDelete path={track ? `/admin/tracks/${track.id}` : null} title="Delete this track?" subject={track?.title}
      confirmLabel="Delete track" success={`${track?.title ?? 'The track'} was deleted.`} onClose={onClose} onDone={onDone}>
      <p>Deleting the track also deletes everything that belongs to it:</p>
      <DeletedWith items={[
        levels > 0 ? `${plural(levels, 'course')}, with every lesson and lab in ${levels === 1 ? 'it' : 'them'}` : null,
        exams === 0 ? null : `${exams === undefined ? 'Its exams' : plural(exams, 'exam')}, and every attempt learners have made`,
        levels > 0 ? `Learners’ enrollments, lesson progress and lab submissions in ${levels === 1 ? 'that course' : 'those courses'}` : null,
        'Exam rules that draw on this track, including rules in other tracks’ exams',
      ]} />
      <p>Questions in the bank are kept, but no longer belong to a track.</p>
    </ConfirmDelete>
  );
}

export function DeleteCourseDialog({ course, onClose, onDone }: DialogProps & { course: AdminCourse | null }) {
  const lessons = useApi<Page<LessonRow>>(course ? `/admin/lessons?courseId=${course.id}&pageSize=1` : null);
  const exams = useApi<{ exams: ExamRow[] }>(course ? '/admin/exams' : null);
  const examCount = course ? exams.data?.exams.filter((exam) => exam.courseId === course.id).length : undefined;
  const contents = sentence([its(lessons.data?.total, 'lesson'), its(examCount, 'exam'), 'every lab in it']);
  return (
    <ConfirmDelete path={course ? `/admin/courses/${course.id}` : null} title="Delete this course?" subject={course ? `${course.title} · ${course.trackTitle}` : undefined}
      confirmLabel="Delete course" success={`${course?.title ?? 'The course'} was deleted.`} onClose={onClose} onDone={onDone}>
      <p>Deleting the course also deletes everything that belongs to it:</p>
      <DeletedWith items={[
        `${contents[0]?.toUpperCase()}${contents.slice(1)}`,
        'Learners’ enrollment and progress in this course, with their exam attempts and lab submissions',
      ]} />
      <p>The track and its other courses are not affected. Questions in the bank are kept.</p>
    </ConfirmDelete>
  );
}
