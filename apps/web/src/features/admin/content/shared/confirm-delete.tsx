'use client';

import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { Modal } from '@/design/primitives/modal';
import { api, errorMessage } from '@/lib/api';
import { useSave } from './use-save';

interface ConfirmDeleteProps {
  /** The path to send DELETE to, or null while the dialog is closed. */
  path: string | null;
  title: string;
  /** The thing being deleted, named under the title. */
  subject?: string;
  confirmLabel: string;
  /** The toast shown once it is gone. */
  success: string;
  /** What is deleted along with it. */
  children: ReactNode;
  onClose: () => void;
  onDone: () => void;
}

/** Asks before deleting, and says what else goes with the thing being deleted. */
export function ConfirmDelete({ path, title, subject, confirmLabel, success, children, onClose, onDone }: ConfirmDeleteProps) {
  const { busy, error, run, clear } = useSave();

  const close = () => {
    clear();
    onClose();
  };
  const confirm = async () => {
    if (!path) return;
    const removed = await run(() => api.delete(path), success);
    if (!removed) return;
    onDone();
    onClose();
  };

  return (
    <Modal open={path !== null} onClose={close} title={title} description={subject}
      footer={<>
        <Button variant="ghost" onClick={close}>Cancel</Button>
        <Button variant="danger" loading={busy} onClick={() => void confirm()} icon={<Trash2 className="size-4" />}>{confirmLabel}</Button>
      </>}>
      <div className="space-y-4 text-sm leading-relaxed text-ink-2">
        {error ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        {children}
        <p className="font-semibold text-ink">This cannot be undone.</p>
      </div>
    </Modal>
  );
}

/** The list of things that go too, drawn as a marked-off block. A null entry does not apply and is left out. */
export function DeletedWith({ items }: { items: (ReactNode | null)[] }) {
  return (
    <ul className="space-y-1.5 border-l-2 border-crimson/50 pl-4">
      {items.filter((item) => item !== null).map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
}
