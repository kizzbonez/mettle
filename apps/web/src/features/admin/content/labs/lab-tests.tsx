'use client';

import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { Checkbox } from '@/design/primitives/field';
import { fieldErrors } from '@/lib/api';
import { BareInput, BareTextArea, RowError } from '../shared/bare-field';
import { IconButton } from '../shared/icon-button';
import { move, patchAt, removeAt } from '../shared/lists';
import type { FormDraft } from '../shared/use-editor';
import { MAX_TESTS, newTest, TEST_HELP, type LabForm, type TestDraft } from './lab-model';

interface TestRowProps {
  test: TestDraft;
  index: number;
  count: number;
  error?: string;
  onChange: (patch: Partial<TestDraft>) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}

function TestRow({ test, index, count, error, onChange, onMove, onRemove }: TestRowProps) {
  const name = `Test ${index + 1}`;
  return (
    <li className="space-y-2 rounded-plate border border-rule bg-white/50 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:flex-nowrap">
        <span className="display w-7 shrink-0 text-xl text-steel tabular-nums" aria-hidden>{String(index + 1).padStart(2, '0')}</span>
        <BareInput label={`${name}: name`} value={test.name} onChange={(event) => onChange({ name: event.target.value })} maxLength={160}
          placeholder="What this test checks, as the learner will read it" className="min-w-0 flex-1" />
        <Checkbox label="Hidden" checked={test.hidden} onChange={(event) => onChange({ hidden: event.target.checked })} aria-label={`${name} is hidden`} className="shrink-0 items-center" />
        <div className="flex shrink-0">
          <IconButton label={`Move ${name.toLowerCase()} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></IconButton>
          <IconButton label={`Move ${name.toLowerCase()} down`} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown className="size-4" /></IconButton>
          <IconButton label={`Remove ${name.toLowerCase()}`} disabled={count <= 1} onClick={onRemove}><X className="size-4" /></IconButton>
        </div>
      </div>
      <BareTextArea label={`${name}: body`} value={test.code} onChange={(event) => onChange({ code: event.target.value })} spellCheck={false}
        placeholder="Assertions in the lab's language" className="h-44 font-mono text-[13px]!" />
      <RowError>{error}</RowError>
    </li>
  );
}

/** The tests tab: the cases that decide whether a submission passes. */
export function LabTests({ draft, error }: { draft: FormDraft<LabForm>; error: unknown }) {
  const { tests, language } = draft.form;
  const fields = fieldErrors(error);
  const change = (next: TestDraft[]) => draft.set({ tests: next });
  const hidden = tests.filter((test) => test.hidden).length;
  const rowError = (index: number) => fields[`tests.${index}.name`] ?? fields[`tests.${index}.code`];
  return (
    <div className="space-y-4">
      <div className="max-w-3xl space-y-1.5 text-sm text-steel">
        <p>{TEST_HELP[language]}</p>
        <p>A visible test is a sample: learners read its source and run it with Run. A hidden test runs only on Submit, and learners see its name and result but never its source.</p>
      </div>
      {tests.length > 0 && hidden === tests.length ? (
        <Notice tone="warning">Every test is hidden, so Run would have nothing to execute. Leave at least one visible as a sample.</Notice>
      ) : null}
      <ol className="space-y-4">
        {tests.map((test, index) => (
          <TestRow key={test.key} test={test} index={index} count={tests.length} error={rowError(index)}
            onChange={(patch) => change(patchAt(tests, index, patch))} onMove={(by) => change(move(tests, index, by))} onRemove={() => change(removeAt(tests, index))} />
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" disabled={tests.length >= MAX_TESTS} onClick={() => change([...tests, newTest(true)])} icon={<Plus className="size-4" />}>Add test</Button>
        <span className="text-[13px] text-steel tabular-nums">{tests.length} of {MAX_TESTS} · {tests.length - hidden} visible, {hidden} hidden</span>
        <RowError>{fields.tests}</RowError>
      </div>
    </div>
  );
}
