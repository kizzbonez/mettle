'use client';

import type { Difficulty, PublishStatus, QuestionType } from '@mettle/shared';
import { SelectField } from '@/design/primitives/field';
import type { AdminTrack, Category } from '@/types/content-admin';
import { MarkdownEditor } from '../shared/markdown-editor';
import { CategoryOptions, LevelOptions, StatusOptions, TrackOptions, TypeOptions } from '../shared/options';
import type { FormDraft } from '../shared/use-editor';
import { listError } from '../shared/use-save';
import { OptionsEditor } from './options-editor';
import { withType, type QuestionForm } from './question-model';
import { TagInput } from './tag-input';

interface QuestionFieldsProps {
  draft: FormDraft<QuestionForm>;
  fields: Record<string, string>;
  tracks: AdminTrack[];
  categories: Category[];
}

/** Where the question is filed: what exams filter on when they draw from the bank. */
function Filing({ draft, fields, tracks, categories }: QuestionFieldsProps) {
  const { form, set, setForm } = draft;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SelectField label="Type" value={form.type} onChange={(event) => setForm(withType(form, event.target.value as QuestionType))} error={fields.type}>
        <TypeOptions />
      </SelectField>
      <SelectField label="Difficulty" value={form.difficulty} onChange={(event) => set({ difficulty: event.target.value as Difficulty })} error={fields.difficulty}>
        <LevelOptions />
      </SelectField>
      <SelectField label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as PublishStatus })} error={fields.status}
        hint="Exams draw only published questions.">
        <StatusOptions />
      </SelectField>
      <SelectField label="Track" value={form.trackId} onChange={(event) => set({ trackId: event.target.value })} error={fields.trackId}>
        <option value="">No track</option>
        <TrackOptions tracks={tracks} />
      </SelectField>
      <SelectField label="Category" value={form.categoryId} onChange={(event) => set({ categoryId: event.target.value })} error={fields.categoryId}>
        <option value="">No category</option>
        <CategoryOptions categories={categories} />
      </SelectField>
      <TagInput label="Tags" value={form.tags} onChange={(tags) => set({ tags })} error={listError(fields, 'tags')} />
    </div>
  );
}

/** Every field of a question: how it is filed, the prompt, the answer options and the explanation. */
export function QuestionFields(props: QuestionFieldsProps) {
  const { form, set } = props.draft;
  return (
    <>
      <Filing {...props} />
      <MarkdownEditor label="Prompt" size="sm" compact value={form.promptMd} onChange={(promptMd) => set({ promptMd })} error={props.fields.promptMd}
        hint="The question as the learner reads it. Markdown, with code in backticks." />
      <OptionsEditor form={form} onChange={(options) => set({ options })} fields={props.fields} />
      <MarkdownEditor label="Explanation" size="sm" compact value={form.explanationMd} onChange={(explanationMd) => set({ explanationMd })} error={props.fields.explanationMd}
        hint="Shown in the review after the exam is graded: why the answer is right." />
    </>
  );
}
