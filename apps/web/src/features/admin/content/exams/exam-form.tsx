'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '@/design/patterns/page-header';
import { api } from '@/lib/api';
import type { AdminCourse, AdminTrack, Category, ExamDetail } from '@/types/content-admin';
import { EditorActions, EditorFooter } from '../shared/editor-actions';
import { FormError } from '../shared/form-error';
import { useFormDraft } from '../shared/use-editor';
import { useSave } from '../shared/use-save';
import { DeleteExamDialog } from './delete-exam';
import { ExamBlueprint } from './exam-blueprint';
import { ExamDetails, ExamSitting } from './exam-details';
import { blankExam, EXAM_FIELDS, examBodyOf, examFormOf, EXAMS } from './exam-model';

const FORM_ID = 'exam-form';

interface ExamFormProps {
  /** The exam to edit, with its rules and pinned questions, or null to create one. */
  detail: ExamDetail | null;
  tracks: AdminTrack[];
  courses: AdminCourse[];
  categories: Category[];
  /** Reloads the saved copy, which brings back fresh pool counts for the rules. */
  onSaved: () => Promise<unknown>;
}

export function ExamFormView({ detail, tracks, courses, categories, onSaved }: ExamFormProps) {
  const router = useRouter();
  const saved = useMemo(() => (detail ? examFormOf(detail) : blankExam()), [detail]);
  const draft = useFormDraft(saved);
  const { busy, error, fields, run } = useSave();
  const [deleting, setDeleting] = useState(false);
  const exam = detail?.exam ?? null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const title = draft.form.title.trim() || 'The exam';
    const body = examBodyOf(draft.form);
    draft.markSent();
    if (exam) {
      if (await run(() => api.put(`/admin/exams/${exam.id}`, body), `${title} was saved.`)) await onSaved();
      return;
    }
    const created = await run(() => api.post<{ id: string }>('/admin/exams', body), `${title} was created.`);
    if (created) router.replace(`${EXAMS}/${created.id}`);
  }

  const actions = {
    formId: FORM_ID, busy, unchanged: exam !== null && !draft.dirty, saveLabel: exam ? 'Save exam' : 'Create exam',
    backHref: EXAMS, onDelete: exam ? () => setDeleting(true) : undefined,
  };

  return (
    <>
      <PageHeader crumbs={[{ label: 'Exams', href: EXAMS }, { label: exam ? 'Edit exam' : 'New exam' }]} title={exam?.title ?? 'New exam'} actions={<EditorActions {...actions} />} />
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
        <FormError error={error} placed={EXAM_FIELDS} />
        <ExamDetails draft={draft} tracks={tracks} courses={courses} error={error} creating={exam === null} />
        <ExamSitting draft={draft} error={error} />
        <ExamBlueprint draft={draft} fields={fields} tracks={tracks} categories={categories} />
        <EditorFooter {...actions} />
      </form>
      <DeleteExamDialog exam={deleting ? exam : null} onClose={() => setDeleting(false)} onDone={() => router.push(EXAMS)} />
    </>
  );
}
