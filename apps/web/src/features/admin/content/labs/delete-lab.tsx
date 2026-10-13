'use client';

import { ConfirmDelete, DeletedWith } from '../shared/confirm-delete';

interface DeleteLabDialogProps {
  /** The lab to delete, or null while the dialog is closed. */
  lab: { id: string; title: string } | null;
  onClose: () => void;
  onDone: () => void;
}

/** Confirms deleting a lab, from the list or from its editor. */
export function DeleteLabDialog({ lab, onClose, onDone }: DeleteLabDialogProps) {
  return (
    <ConfirmDelete path={lab ? `/admin/labs/${lab.id}` : null} title="Delete this lab?" subject={lab?.title}
      confirmLabel="Delete lab" success={`${lab?.title ?? 'The lab'} was deleted.`} onClose={onClose} onDone={onDone}>
      <p>Deleting the lab also deletes everything that belongs to it:</p>
      <DeletedWith items={[
        'Its test cases, fixtures, starter code and reference solution',
        'Every submission learners have made to it, with the results',
        'The unfinished code learners have saved in it',
      ]} />
      <p>Course progress is then counted without it. To close a lab and keep its submissions, set its status to archived instead.</p>
    </ConfirmDelete>
  );
}
