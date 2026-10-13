'use client';

import { Upload } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { SelectField } from '@/design/primitives/field';
import { Modal } from '@/design/primitives/modal';
import { api } from '@/lib/api';
import { plural } from '@/lib/format';
import type { AdminTrack, Category } from '@/types/content-admin';
import { CategoryOptions, TrackOptions } from '../shared/options';
import { useSave } from '../shared/use-save';
import { ImportCount, ImportRejected, ImportShape, ImportSource } from './import-parts';
import { IMPORT_LIMIT, parseImport, withDefaults } from './import-parse';

interface ImportDialogProps {
  open: boolean;
  tracks: AdminTrack[];
  categories: Category[];
  onClose: () => void;
  onDone: () => void;
}

/** Adds many questions at once from a JSON array, pasted or read from a file. */
export function ImportDialog({ open, tracks, categories, onClose, onDone }: ImportDialogProps) {
  const [text, setText] = useState('');
  const [trackId, setTrackId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { busy, error, run, clear } = useSave();
  const parsed = useMemo(() => parseImport(text), [text]);
  const questions = parsed?.ok ? parsed.questions : [];

  useEffect(() => {
    if (!open) return;
    setText('');
    clear();
  }, [open, clear]);

  const edit = (next: string) => {
    setText(next);
    clear();
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (questions.length === 0) return;
    const body = { questions: withDefaults(questions, trackId, categoryId) };
    const done = await run(() => api.post<{ created: number }>('/admin/questions/import', body), (result) => `${plural(result.created, 'question')} imported.`);
    if (!done) return;
    onDone();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Import questions" description={`Add up to ${IMPORT_LIMIT} questions at once from a JSON array.`}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="import-form" loading={busy} disabled={questions.length === 0} icon={<Upload className="size-4" />}>
          {questions.length > 0 ? `Import ${plural(questions.length, 'question')}` : 'Import'}
        </Button>
      </>}>
      <form id="import-form" onSubmit={submit} className="space-y-5">
        <Notice title="An import is all or nothing">If the server rejects any one question, none of them are added. You fix the file and import it again, with no half-finished import to clean up.</Notice>
        <ImportRejected error={error} questions={questions} />
        <ImportSource text={text} onText={edit} />
        <ImportCount parsed={parsed} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Track for questions without one" value={trackId} onChange={(event) => setTrackId(event.target.value)}>
            <option value="">No track</option>
            <TrackOptions tracks={tracks} />
          </SelectField>
          <SelectField label="Category for questions without one" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">No category</option>
            <CategoryOptions categories={categories} />
          </SelectField>
        </div>
        <ImportShape />
      </form>
    </Modal>
  );
}
