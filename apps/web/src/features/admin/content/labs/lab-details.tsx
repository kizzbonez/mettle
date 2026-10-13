'use client';

import type { LabLanguage, PublishStatus } from '@mettle/shared';
import { SelectField, TextAreaField, TextField } from '@/design/primitives/field';
import { fieldErrors } from '@/lib/api';
import type { AdminCourse } from '@/types/content-admin';
import { followTitle } from '../shared/labels';
import { MarkdownEditor } from '../shared/markdown-editor';
import { CourseOptions, LanguageOptions, StatusOptions } from '../shared/options';
import type { FormDraft } from '../shared/use-editor';
import { slugError } from '../shared/use-save';
import type { LabForm } from './lab-model';

interface LabDetailsProps {
  draft: FormDraft<LabForm>;
  courses: AdminCourse[];
  error: unknown;
  creating: boolean;
}

/** The details tab: where the lab sits, its language, and the limits its tests run under. */
export function LabDetails({ draft, courses, error, creating }: LabDetailsProps) {
  const { form, set, setForm } = draft;
  const fields = fieldErrors(error);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Title" value={form.title} onChange={(event) => setForm(followTitle(form, event.target.value, creating))} error={fields.title} maxLength={160} />
        <SelectField label="Course" value={form.courseId} onChange={(event) => set({ courseId: event.target.value })} error={fields.courseId ? 'Choose a course.' : undefined}>
          <option value="">Choose a course</option>
          <CourseOptions courses={courses} />
        </SelectField>
        <TextField label="Slug" value={form.slug} onChange={(event) => set({ slug: event.target.value })} error={slugError(error)} maxLength={80}
          className="font-mono" hint="Lowercase letters, numbers and hyphens. Unique within the course." spellCheck={false} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Language" value={form.language} onChange={(event) => set({ language: event.target.value as LabLanguage })} error={fields.language}>
            <LanguageOptions />
          </SelectField>
          <SelectField label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PublishStatus })} error={fields.status}>
            <StatusOptions />
          </SelectField>
        </div>
      </div>
      <TextAreaField label="Summary" value={form.summary} onChange={(event) => set({ summary: event.target.value })} error={fields.summary} maxLength={500}
        className="min-h-20" hint="One or two sentences, shown in the course outline." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Time limit per test (ms)" type="number" min={500} max={15000} step={100} value={form.timeLimitMs} onChange={(event) => set({ timeLimitMs: event.target.value })}
          error={fields.timeLimitMs} hint="500 to 15,000." />
        <TextField label="Memory (MB)" type="number" min={32} max={1024} step={1} value={form.memoryMb} onChange={(event) => set({ memoryMb: event.target.value })}
          error={fields.memoryMb} hint="32 to 1,024." />
        <TextField label="Estimated minutes" type="number" min={1} max={480} step={1} value={form.estMinutes} onChange={(event) => set({ estMinutes: event.target.value })}
          error={fields.estMinutes} />
        <TextField label="Sort order" type="number" min={0} max={10000} step={1} value={form.sortOrder} onChange={(event) => set({ sortOrder: event.target.value })}
          error={fields.sortOrder} hint="Lower numbers come first." />
      </div>
    </div>
  );
}

/** The brief tab: what the learner reads before writing any code. */
export function LabBrief({ draft, error }: Pick<LabDetailsProps, 'draft' | 'error'>) {
  const { form, set } = draft;
  const fields = fieldErrors(error);
  return (
    <div className="space-y-6">
      <MarkdownEditor label="Scenario" value={form.scenarioMd} onChange={(scenarioMd) => set({ scenarioMd })} error={fields.scenarioMd}
        hint="The situation: who needs this, and what went wrong." />
      <MarkdownEditor label="Instructions" value={form.instructionsMd} onChange={(instructionsMd) => set({ instructionsMd })} error={fields.instructionsMd}
        hint="Exactly what to build: names, inputs, outputs and edge cases the tests check." />
    </div>
  );
}
