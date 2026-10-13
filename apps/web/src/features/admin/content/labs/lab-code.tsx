'use client';

import { LAB_SOLUTION_FILE, type LabLanguage } from '@mettle/shared';
import dynamic from 'next/dynamic';
import { Spinner } from '@/design/primitives/spinner';
import { fieldErrors } from '@/lib/api';
import { RowError } from '../shared/bare-field';
import type { FormDraft } from '../shared/use-editor';
import type { LabForm } from './lab-model';

// Monaco touches `window` as it loads, so it is only ever rendered in the browser.
const CodeEditor = dynamic(() => import('@/features/labs/code-editor').then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center"><Spinner className="text-ember" label="Loading the editor" /></div>,
});

/** The editor's Run and Submit shortcuts belong to the learner's workspace; here they do nothing. */
const nothing = () => undefined;

interface CodePaneProps {
  title: string;
  note: string;
  language: LabLanguage;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function CodePane({ title, note, language, value, onChange, error }: CodePaneProps) {
  return (
    <section aria-label={title} className="min-w-0 space-y-1.5">
      <h3 className="label-spec text-ink-2">{title}</h3>
      <div className="overflow-hidden rounded-plate border border-forge-rule bg-forge">
        <p className="label-spec border-b border-forge-rule bg-forge-2 px-4 py-2 text-forge-muted normal-case">{LAB_SOLUTION_FILE[language]}</p>
        <div className="h-[28rem]">
          <CodeEditor language={language} value={value} onChange={onChange} onRun={nothing} onSubmit={nothing} />
        </div>
      </div>
      {error ? <RowError>{error}</RowError> : <p className="text-[13px] text-steel">{note}</p>}
    </section>
  );
}

/** The code tab: what the learner starts from, and a solution that proves the tests can be passed. */
export function LabCode({ draft, error }: { draft: FormDraft<LabForm>; error: unknown }) {
  const { form, set } = draft;
  const fields = fieldErrors(error);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <CodePane title="Starter code" language={form.language} value={form.starterCode} onChange={(starterCode) => set({ starterCode })} error={fields.starterCode}
        note="What the learner's editor opens with. It should build, and it should not pass the tests." />
      <CodePane title="Reference solution" language={form.language} value={form.solutionCode} onChange={(solutionCode) => set({ solutionCode })} error={fields.solutionCode}
        note="Never sent to learners. The sandbox check runs it to prove the tests can be passed." />
    </div>
  );
}
