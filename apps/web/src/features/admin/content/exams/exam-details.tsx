'use client';

import type { PublishStatus } from '@mettle/shared';
import { Checkbox, SelectField, TextAreaField, TextField } from '@/design/primitives/field';
import { fieldErrors } from '@/lib/api';
import type { AdminCourse, AdminTrack } from '@/types/content-admin';
import { FormSection } from '../shared/form-layout';
import { followTitle } from '../shared/labels';
import { CourseOptions, StatusOptions, TrackOptions } from '../shared/options';
import type { FormDraft } from '../shared/use-editor';
import { slugError } from '../shared/use-save';
import type { ExamForm } from './exam-model';

interface ExamDetailsProps {
  draft: FormDraft<ExamForm>;
  tracks: AdminTrack[];
  courses: AdminCourse[];
  error: unknown;
  creating: boolean;
}

/** What the exam is and where it sits. */
export function ExamDetails({ draft, tracks, courses, error, creating }: ExamDetailsProps) {
  const { form, set, setForm } = draft;
  const fields = fieldErrors(error);
  const inTrack = courses.filter((course) => course.trackId === form.trackId);
  return (
    <FormSection title="Details" caption="What the exam is called and where learners find it.">
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Title" value={form.title} onChange={(event) => setForm(followTitle(form, event.target.value, creating))} error={fields.title} maxLength={160} />
        <TextField label="Slug" value={form.slug} onChange={(event) => set({ slug: event.target.value })} error={slugError(error)} maxLength={80}
          className="font-mono" hint="Lowercase letters, numbers and hyphens. Unique within the track." spellCheck={false} />
        {/* A course belongs to one track, so changing the track clears a course from another. */}
        <SelectField label="Track" value={form.trackId} onChange={(event) => set({ trackId: event.target.value, courseId: '' })} error={fields.trackId ? 'Choose a track.' : undefined}>
          <option value="">Choose a track</option>
          <TrackOptions tracks={tracks} />
        </SelectField>
        <SelectField label="Course" value={form.courseId} onChange={(event) => set({ courseId: event.target.value })} error={fields.courseId} disabled={!form.trackId}
          hint="Leave as the whole track for an exam that is not part of one level.">
          <option value="">Whole track</option>
          <CourseOptions courses={inTrack} />
        </SelectField>
      </div>
      <TextAreaField label="Description" value={form.description} onChange={(event) => set({ description: event.target.value })} error={fields.description} maxLength={1000}
        className="min-h-20" hint="Shown before the learner starts: what the exam covers." />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PublishStatus })} error={fields.status}
          hint="Learners can take it once it, its track and its course are published.">
          <StatusOptions />
        </SelectField>
        <TextField label="Sort order" type="number" min={0} max={10000} step={1} value={form.sortOrder} onChange={(event) => set({ sortOrder: event.target.value })} error={fields.sortOrder}
          hint="Lower numbers come first." />
      </div>
    </FormSection>
  );
}

/** The conditions of a sitting: how long, how many tries, what counts as a pass. */
export function ExamSitting({ draft, error }: Pick<ExamDetailsProps, 'draft' | 'error'>) {
  const { form, set } = draft;
  const fields = fieldErrors(error);
  return (
    <FormSection title="Sitting" caption="The conditions every attempt is taken under.">
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField label="Time limit (minutes)" type="number" min={1} max={480} step={1} value={form.timeLimitMinutes} onChange={(event) => set({ timeLimitMinutes: event.target.value })}
          error={fields.timeLimitMinutes} hint="The attempt closes when the time runs out." />
        <TextField label="Pass mark (%)" type="number" min={1} max={100} step={1} value={form.passPercent} onChange={(event) => set({ passPercent: event.target.value })}
          error={fields.passPercent} />
        <TextField label="Attempts allowed" type="number" min={1} max={100} step={1} value={form.maxAttempts} onChange={(event) => set({ maxAttempts: event.target.value })}
          error={fields.maxAttempts} placeholder="Unlimited" hint="Leave empty for no limit." />
      </div>
      <div className="border border-rule bg-white p-4">
        <Checkbox checked={form.shuffleOptions} onChange={(event) => set({ shuffleOptions: event.target.checked })}
          label={<span><span className="font-semibold text-ink">Shuffle the answer options</span><span className="mt-0.5 block text-steel">Each attempt sees a question&apos;s options in a different order.</span></span>} />
      </div>
    </FormSection>
  );
}
