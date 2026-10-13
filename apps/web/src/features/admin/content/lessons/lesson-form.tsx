'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '@/design/patterns/page-header';
import { api } from '@/lib/api';
import type { AdminCourse, AdminLesson } from '@/types/content-admin';
import { ConfirmDelete } from '../shared/confirm-delete';
import { EditorActions, EditorFooter } from '../shared/editor-actions';
import { FormError } from '../shared/form-error';
import { FormSection } from '../shared/form-layout';
import { MarkdownEditor } from '../shared/markdown-editor';
import { useFormDraft } from '../shared/use-editor';
import { useSave } from '../shared/use-save';
import { LessonDetails } from './lesson-details';
import { blankLesson, LESSON_DELETE_NOTE, LESSON_FIELDS, lessonBodyOf, lessonFormOf, LESSONS } from './lesson-model';

const FORM_ID = 'lesson-form';

interface LessonFormProps {
  /** The lesson to edit, or null to write a new one. */
  lesson: AdminLesson | null;
  courses: AdminCourse[];
  /** The course a new lesson starts in, when the list was filtered to one. */
  startCourseId: string;
  /** Reloads the saved copy after a change. */
  onSaved: () => Promise<unknown>;
}

export function LessonForm({ lesson, courses, startCourseId, onSaved }: LessonFormProps) {
  const router = useRouter();
  const saved = useMemo(() => (lesson ? lessonFormOf(lesson) : { ...blankLesson, courseId: startCourseId }), [lesson, startCourseId]);
  const draft = useFormDraft(saved);
  const { form, set } = draft;
  const { busy, error, fields, run } = useSave();
  const [deleting, setDeleting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim() || 'The lesson';
    draft.markSent();
    if (lesson) {
      if (await run(() => api.patch(`/admin/lessons/${lesson.id}`, lessonBodyOf(form)), `${title} was saved.`)) await onSaved();
      return;
    }
    const created = await run(() => api.post<{ lesson: AdminLesson }>('/admin/lessons', lessonBodyOf(form)), `${title} was created.`);
    if (created) router.replace(`${LESSONS}/${created.lesson.id}`);
  }

  const actions = {
    formId: FORM_ID, busy, unchanged: lesson !== null && !draft.dirty, saveLabel: lesson ? 'Save lesson' : 'Create lesson',
    backHref: LESSONS, onDelete: lesson ? () => setDeleting(true) : undefined,
  };

  return (
    <>
      <PageHeader crumbs={[{ label: 'Lessons', href: LESSONS }, { label: lesson ? 'Edit lesson' : 'New lesson' }]}
        title={lesson?.title ?? 'New lesson'} actions={<EditorActions {...actions} />} />
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
        <FormError error={error} placed={LESSON_FIELDS} />
        <LessonDetails draft={draft} courses={courses} error={error} creating={lesson === null} />
        <FormSection title="Body" caption="Written in Markdown. The title is the page heading, so start sections at ##.">
          <MarkdownEditor label="Lesson body" size="lg" value={form.bodyMd} onChange={(bodyMd) => set({ bodyMd })} error={fields.bodyMd}
            hint={`${form.bodyMd.length.toLocaleString()} of 100,000 characters. A code fence is highlighted when it names its language.`} />
        </FormSection>
        <EditorFooter {...actions} />
      </form>
      <ConfirmDelete path={deleting && lesson ? `/admin/lessons/${lesson.id}` : null} title="Delete this lesson?" subject={lesson?.title}
        confirmLabel="Delete lesson" success={`${lesson?.title ?? 'The lesson'} was deleted.`} onClose={() => setDeleting(false)} onDone={() => router.push(LESSONS)}>
        <p>{LESSON_DELETE_NOTE}</p>
      </ConfirmDelete>
    </>
  );
}
