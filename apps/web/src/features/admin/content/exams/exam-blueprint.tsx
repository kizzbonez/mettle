'use client';

import { useId } from 'react';
import { Notice } from '@/design/patterns/notice';
import { plural } from '@/lib/format';
import type { AdminTrack, Category, ExamMode } from '@/types/content-admin';
import { FormSection } from '../shared/form-layout';
import type { FormDraft } from '../shared/use-editor';
import type { ExamForm } from './exam-model';
import { QuestionPicker } from './question-picker';
import { RulesBuilder } from './rules-builder';

const MODES: { key: ExamMode; title: string; text: string }[] = [
  { key: 'dynamic', title: 'Dynamic', text: 'Each attempt is sampled from the bank by rules, so no two learners get the same paper.' },
  { key: 'fixed', title: 'Fixed', text: 'Every learner gets the same pinned questions, in the same order.' },
];

const card =
  'block h-full cursor-pointer rounded-plate border border-rule bg-white px-4 py-3 hover:border-steel-2 ' +
  'peer-checked:border-ink peer-checked:shadow-press peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember';

function ModeChoice({ value, onChange }: { value: ExamMode; onChange: (mode: ExamMode) => void }) {
  const group = useId();
  return (
    <fieldset>
      <legend className="label-spec text-ink-2">Mode</legend>
      <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => (
          <label key={mode.key}>
            <input type="radio" name={group} value={mode.key} checked={value === mode.key} onChange={() => onChange(mode.key)} className="peer sr-only" />
            <span className={card}>
              <span className="block font-semibold text-ink">{mode.title}</span>
              <span className="mt-0.5 block text-[13px] text-steel">{mode.text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ExamBlueprintProps {
  draft: FormDraft<ExamForm>;
  fields: Record<string, string>;
  tracks: AdminTrack[];
  categories: Category[];
}

/** Where an exam's questions come from: rules that sample the bank, or a pinned list. */
export function ExamBlueprint({ draft, fields, tracks, categories }: ExamBlueprintProps) {
  const { form, set } = draft;
  const dynamic = form.mode === 'dynamic';
  // Only the chosen mode's blueprint is saved, so say what the other one holds before it goes.
  const unused = dynamic ? form.questions.length : form.rules.length;
  return (
    <FormSection title="Questions" caption="Where the questions on each attempt come from.">
      <ModeChoice value={form.mode} onChange={(mode) => set({ mode })} />
      {unused > 0 ? (
        <Notice tone="warning">
          This exam also has {plural(unused, dynamic ? 'pinned question' : 'rule')} from {dynamic ? 'fixed' : 'dynamic'} mode. Saving in {form.mode} mode removes {unused === 1 ? 'it' : 'them'}.
        </Notice>
      ) : null}
      {dynamic ? (
        <RulesBuilder rules={form.rules} examTrackId={form.trackId} tracks={tracks} categories={categories} fields={fields} onChange={(rules) => set({ rules })} />
      ) : (
        <QuestionPicker pinned={form.questions} examTrackId={form.trackId} error={fields.questionIds} onChange={(questions) => set({ questions })} />
      )}
    </FormSection>
  );
}
