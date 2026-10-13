'use client';

import { useMemo, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { Modal } from '@/design/primitives/modal';
import { PageSpinner } from '@/design/primitives/spinner';
import { api } from '@/lib/api';
import type { AdminQuestion, AdminTrack, Category } from '@/types/content-admin';
import { FormError } from '../shared/form-error';
import { useEditable, useFormDraft } from '../shared/use-editor';
import { useSave } from '../shared/use-save';
import { QuestionFields } from './question-fields';
import { blankQuestion, QUESTION_FIELDS, questionBodyOf, questionFormOf } from './question-model';

interface EditorProps {
  /** The question to edit, or null to write a new one. */
  questionId: string | null;
  /** The track a new question starts in, when the table is filtered to one. */
  startTrackId: string;
  tracks: AdminTrack[];
  categories: Category[];
  onClose: () => void;
  onDone: () => void;
}

function QuestionEditor({ questionId, startTrackId, tracks, categories, onClose, onDone }: EditorProps) {
  const item = useEditable<{ question: AdminQuestion }>(questionId ? `/admin/questions/${questionId}` : null);
  const question = item.data?.question;
  const saved = useMemo(() => (question ? questionFormOf(question) : blankQuestion(startTrackId)), [question, startTrackId]);
  const draft = useFormDraft(saved);
  const { busy, error, fields, run } = useSave();
  const ready = questionId === null || question !== undefined;

  async function submit(event: FormEvent) {
    event.preventDefault();
    // Each saved option goes back with its id, so the API updates it in place instead of replacing it.
    const body = questionBodyOf(draft.form);
    const send = () => (questionId ? api.put(`/admin/questions/${questionId}`, body) : api.post('/admin/questions', body));
    const done = await run(send, questionId ? 'The question was saved.' : 'The question was added to the bank.');
    if (!done) return;
    onDone();
    onClose();
  }

  return (
    <Modal open onClose={onClose} size="xl" title={questionId ? 'Edit question' : 'New question'}
      description={questionId ? 'Options are updated in place, so past attempts still show which one each learner chose.' : 'A question belongs to the bank, not to one exam. Exams draw from it by track, category, difficulty and tag.'}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="question-form" loading={busy} disabled={!ready}>{questionId ? 'Save question' : 'Add question'}</Button>
      </>}>
      {item.error ? <Notice tone="error" title="This question could not be loaded">{item.error.message}</Notice> : null}
      {!ready && !item.error ? <PageSpinner label="Loading the question" /> : null}
      {ready ? (
        <form id="question-form" onSubmit={submit} noValidate className="space-y-6">
          <FormError error={error} placed={QUESTION_FIELDS} />
          <QuestionFields draft={draft} fields={fields} tracks={tracks} categories={categories} />
        </form>
      ) : null}
    </Modal>
  );
}

export type QuestionTarget = { id: string | null } | null;

/** The create and edit dialog. Mounted afresh each time it opens, so it always starts from the saved question. */
export function QuestionDialog({ target, ...rest }: Omit<EditorProps, 'questionId'> & { target: QuestionTarget }) {
  if (!target) return null;
  return <QuestionEditor key={target.id ?? 'new'} questionId={target.id} {...rest} />;
}
