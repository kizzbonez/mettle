'use client';

import type { PublishStatus } from '@mettle/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/design/primitives/button';
import { SelectField, TextAreaField, TextField } from '@/design/primitives/field';
import { Modal } from '@/design/primitives/modal';
import { api } from '@/lib/api';
import type { AdminTrack } from '@/types/content-admin';
import { FormError } from '../shared/form-error';
import { followTitle, toInt } from '../shared/labels';
import { StatusOptions } from '../shared/options';
import { slugError, useSave } from '../shared/use-save';
import { IconPicker } from './icon-picker';

const blank = { slug: '', title: '', tagline: '', description: '', icon: 'Boxes', status: 'draft' as PublishStatus, sortOrder: '0' };
type TrackForm = typeof blank;
const PLACED = Object.keys(blank);

const formOf = (track: AdminTrack): TrackForm => ({
  slug: track.slug, title: track.title, tagline: track.tagline, description: track.description,
  icon: track.icon, status: track.status, sortOrder: String(track.sortOrder),
});

interface TrackDialogProps {
  open: boolean;
  /** The track to edit, or null to create one. */
  track: AdminTrack | null;
  onClose: () => void;
  onDone: () => void;
}

export function TrackDialog({ open, track, onClose, onDone }: TrackDialogProps) {
  const [form, setForm] = useState(blank);
  const { busy, error, fields, run, clear } = useSave();
  const set = (patch: Partial<TrackForm>) => setForm((current) => ({ ...current, ...patch }));

  useEffect(() => {
    if (!open) return;
    setForm(track ? formOf(track) : blank);
    clear();
  }, [open, track, clear]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    // The whole form is always sent: a field left out of a PATCH is reset to its default by the API.
    const body = { ...form, sortOrder: toInt(form.sortOrder) };
    const send = () => (track ? api.patch(`/admin/tracks/${track.id}`, body) : api.post('/admin/tracks', body));
    const saved = await run(send, `${form.title.trim()} was ${track ? 'updated' : 'created'}.`);
    if (!saved) return;
    onDone();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={track ? 'Edit track' : 'Add a track'}
      description={track ? track.title : 'A track is a subject, such as Rust Development. Add its courses once it exists.'}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="track-form" loading={busy}>{track ? 'Save changes' : 'Create track'}</Button>
      </>}>
      <form id="track-form" onSubmit={submit} noValidate className="space-y-4">
        <FormError error={error} placed={PLACED} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Title" value={form.title} onChange={(event) => setForm(followTitle(form, event.target.value, !track))} error={fields.title} maxLength={160} />
          <TextField label="Slug" value={form.slug} onChange={(event) => set({ slug: event.target.value })} error={slugError(error)} maxLength={80}
            className="font-mono" hint="Lowercase letters, numbers and hyphens." spellCheck={false} />
        </div>
        <TextField label="Tagline" value={form.tagline} onChange={(event) => set({ tagline: event.target.value })} error={fields.tagline} maxLength={200}
          hint="One line, shown under the title in the catalog." />
        <TextAreaField label="Description" value={form.description} onChange={(event) => set({ description: event.target.value })} error={fields.description} maxLength={2000} />
        <IconPicker value={form.icon} onChange={(icon) => set({ icon })} error={fields.icon} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PublishStatus })} error={fields.status}
            hint="Learners see a track only once it is published.">
            <StatusOptions />
          </SelectField>
          <TextField label="Sort order" type="number" min={0} max={10000} step={1} value={form.sortOrder} onChange={(event) => set({ sortOrder: event.target.value })}
            error={fields.sortOrder} hint="Lower numbers come first." />
        </div>
      </form>
    </Modal>
  );
}
