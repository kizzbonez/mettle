'use client';

import { ConfirmDelete } from '../shared/confirm-delete';

interface DeleteExamDialogProps {
  /** The exam to delete, or null while the dialog is closed. */
  exam: { id: string; title: string } | null;
  onClose: () => void;
  onDone: () => void;
}

/** Confirms deleting an exam, from the list or from its editor. */
export function DeleteExamDialog({ exam, onClose, onDone }: DeleteExamDialogProps) {
  return (
    <ConfirmDelete path={exam ? `/admin/exams/${exam.id}` : null} title="Delete this exam?" subject={exam?.title}
      confirmLabel="Delete exam" success={`${exam?.title ?? 'The exam'} was deleted.`} onClose={onClose} onDone={onDone}>
      <p>Deleting the exam also deletes every attempt learners have made at it, with their answers and scores. Course progress is then counted without it.</p>
      <p>The questions stay in the bank. To close an exam without losing its results, set its status to archived instead.</p>
    </ConfirmDelete>
  );
}
