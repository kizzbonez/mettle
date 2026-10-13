'use client';

import type { Difficulty, PublishStatus } from '@mettle/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/design/primitives/button';
import { SelectField, TextAreaField, TextField } from '@/design/primitives/field';
import { Modal } from '@/design/primitives/modal';
import { api } from '@/lib/api';
import type { AdminCourse, AdminTrack } from '@/types/content-admin';
import { FormError } from '../shared/form-error';
import { followTitle, toInt, toLines } from '../shared/labels';
import { LevelOptions, StatusOptions } from '../shared/options';
import { listError, slugError, useSave } from '../shared/use-save';

const blank = { slug: '', level: 'basic' as Difficulty, title: '', summary: '', outcomes: '', status: 'draft' as PublishStatus, sortOrder: '0' };
type CourseForm = typeof blank;
const PLACED = Object.keys(blank);

const formOf = (course: AdminCourse): CourseForm => ({
  slug: course.slug, level: course.level, title: course.title, summary: course.summary,
  outcomes: course.outcomes.join('\n'), status: course.status, sortOrder: String(course.sortOrder),
});

interface CourseDialogProps {
  /** The track the course belongs to, or null while the dialog is closed. */
  track: AdminTrack | null;
  /** The course to edit, or null to add one to the track. */
  course: AdminCourse | null;
  onClose: () => void;
  onDone: () => void;
}

export function CourseDialog({ track, course, onClose, onDone }: CourseDialogProps) {
  const [form, setForm] = useState(blank);
  const { busy, error, fields, run, clear } = useSave();
  const set = (patch: Partial<CourseForm>) => setForm((current) => ({ ...current, ...patch }));

  useEffect(() => {
    if (!track) return;
    setForm(course ? formOf(course) : blank);
    clear();
  }, [track, course, clear]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!track) return;
    const body = { ...form, trackId: track.id, outcomes: toLines(form.outcomes), sortOrder: toInt(form.sortOrder) };
    const send = () => (course ? api.patch(`/admin/courses/${course.id}`, body) : api.post('/admin/courses', body));
    const saved = await run(send, `${form.title.trim()} was ${course ? 'updated' : 'added'}.`);
    if (!saved) return;
    onDone();
    onClose();
  }

  return (
    <Modal open={track !== null} onClose={onClose} size="lg" title={course ? 'Edit course' : 'Add a course'}
      description={track ? `One level of ${track.title}. Its lessons, exams and labs are added on their own pages.` : undefined}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="course-form" loading={busy}>{course ? 'Save changes' : 'Add course'}</Button>
      </>}>
      <form id="course-form" onSubmit={submit} noValidate className="space-y-4">
        <FormError error={error} placed={PLACED} />
        <TextField label="Title" value={form.title} onChange={(event) => setForm(followTitle(form, event.target.value, !course))} error={fields.title} maxLength={160} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Slug" value={form.slug} onChange={(event) => set({ slug: event.target.value })} error={slugError(error)} maxLength={80}
            className="font-mono" hint="Unique within the track." spellCheck={false} />
          <SelectField label="Level" value={form.level} onChange={(event) => set({ level: event.target.value as Difficulty })} error={fields.level}>
            <LevelOptions />
          </SelectField>
        </div>
        <TextAreaField label="Summary" value={form.summary} onChange={(event) => set({ summary: event.target.value })} error={fields.summary} maxLength={1000} className="min-h-20" />
        <TextAreaField label="Outcomes" value={form.outcomes} onChange={(event) => set({ outcomes: event.target.value })} error={listError(fields, 'outcomes')}
          hint={`One per line: what a learner can do after this level. ${toLines(form.outcomes).length} of 20 used.`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PublishStatus })} error={fields.status}
            hint="Learners see a course only once it and its track are published.">
            <StatusOptions />
          </SelectField>
          <TextField label="Sort order" type="number" min={0} max={10000} step={1} value={form.sortOrder} onChange={(event) => set({ sortOrder: event.target.value })}
            error={fields.sortOrder} hint="Lower numbers come first." />
        </div>
      </form>
    </Modal>
  );
}
