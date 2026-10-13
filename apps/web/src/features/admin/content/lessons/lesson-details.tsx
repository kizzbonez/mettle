'use client';

import type { PublishStatus } from '@mettle/shared';
import { SelectField, TextAreaField, TextField } from '@/design/primitives/field';
import { fieldErrors } from '@/lib/api';
import type { AdminCourse } from '@/types/content-admin';
import { FormSection } from '../shared/form-layout';
import { followTitle, toLines } from '../shared/labels';
import { CourseOptions, StatusOptions } from '../shared/options';
import type { FormDraft } from '../shared/use-editor';
import { listError, slugError } from '../shared/use-save';
import type { LessonFormState } from './lesson-model';

interface LessonDetailsProps {
  draft: FormDraft<LessonFormState>;
  courses: AdminCourse[];
  error: unknown;
  creating: boolean;
}

/** Everything about a lesson except its body: where it sits, what it is called, how long it takes. */
export function LessonDetails({ draft, courses, error, creating }: LessonDetailsProps) {
  const { form, set, setForm } = draft;
  const fields = fieldErrors(error);
  return (
    <FormSection title="Details" caption="Where the lesson sits and how it is introduced.">
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Title" value={form.title} onChange={(event) => setForm(followTitle(form, event.target.value, creating))} error={fields.title} maxLength={160} />
        <SelectField label="Course" value={form.courseId} onChange={(event) => set({ courseId: event.target.value })} error={fields.courseId ? 'Choose a course.' : undefined}>
          <option value="">Choose a course</option>
          <CourseOptions courses={courses} />
        </SelectField>
        <TextField label="Slug" value={form.slug} onChange={(event) => set({ slug: event.target.value })} error={slugError(error)} maxLength={80}
          className="font-mono" hint="Lowercase letters, numbers and hyphens. Unique within the course." spellCheck={false} />
        <div className="grid grid-cols-3 gap-4">
          <SelectField label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PublishStatus })} error={fields.status}>
            <StatusOptions />
          </SelectField>
          <TextField label="Minutes" type="number" min={1} max={480} step={1} value={form.estMinutes} onChange={(event) => set({ estMinutes: event.target.value })} error={fields.estMinutes} />
          <TextField label="Sort order" type="number" min={0} max={10000} step={1} value={form.sortOrder} onChange={(event) => set({ sortOrder: event.target.value })} error={fields.sortOrder} />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TextAreaField label="Summary" value={form.summary} onChange={(event) => set({ summary: event.target.value })} error={fields.summary} maxLength={500}
          hint="One or two sentences, shown under the title and in the course outline." />
        <TextAreaField label="Objectives" value={form.objectives} onChange={(event) => set({ objectives: event.target.value })} error={listError(fields, 'objectives')}
          hint={`One per line. ${toLines(form.objectives).length} of 20 used.`} />
      </div>
    </FormSection>
  );
}
