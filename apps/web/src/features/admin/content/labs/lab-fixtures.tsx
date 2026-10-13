'use client';

import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/design/primitives/button';
import { fieldErrors } from '@/lib/api';
import { BareInput, BareTextArea, RowError } from '../shared/bare-field';
import { IconButton } from '../shared/icon-button';
import { patchAt, removeAt } from '../shared/lists';
import type { FormDraft } from '../shared/use-editor';
import { MAX_FIXTURES, newFixture, type LabForm } from './lab-model';

/** The fixtures tab: read-only support files the sandbox places beside the learner's code. */
export function LabFixtures({ draft, error }: { draft: FormDraft<LabForm>; error: unknown }) {
  const { fixtures } = draft.form;
  const fields = fieldErrors(error);
  const change = (next: LabForm['fixtures']) => draft.set({ fixtures: next });
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-steel">
        Read-only files placed beside the learner&apos;s code in the sandbox, each under <span className="font-mono text-[13px] text-ink-2">data/</span>.
        The code and the tests open them by that path. Learners can read them on the lab&apos;s Files tab.
      </p>
      {fixtures.length === 0 ? (
        <p className="border border-dashed border-steel-2 px-4 py-6 text-center text-sm text-steel">This lab has no fixtures. Many do not need any.</p>
      ) : null}
      <ol className="space-y-4">
        {fixtures.map((fixture, index) => {
          const name = `Fixture ${index + 1}`;
          const pathError = fields[`fixtures.${index}.path`];
          return (
            <li key={fixture.key} className="space-y-2 rounded-plate border border-rule bg-white/50 p-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 shrink-0 text-steel" aria-hidden />
                <BareInput label={`${name}: path`} value={fixture.path} onChange={(event) => change(patchAt(fixtures, index, { path: event.target.value }))}
                  placeholder="data/input.txt" maxLength={99} spellCheck={false} invalid={Boolean(pathError)} className="flex-1 font-mono text-sm!" />
                <IconButton label={`Remove ${name.toLowerCase()}`} onClick={() => change(removeAt(fixtures, index))}><X className="size-4" /></IconButton>
              </div>
              <BareTextArea label={`${name}: content`} value={fixture.content} onChange={(event) => change(patchAt(fixtures, index, { content: event.target.value }))}
                spellCheck={false} placeholder="The file's content" className="h-40 font-mono text-[13px]!" />
              <RowError>{pathError ?? fields[`fixtures.${index}.content`]}</RowError>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" disabled={fixtures.length >= MAX_FIXTURES} onClick={() => change([...fixtures, newFixture()])} icon={<Plus className="size-4" />}>Add fixture</Button>
        <span className="text-[13px] text-steel tabular-nums">{fixtures.length} of {MAX_FIXTURES}</span>
        <RowError>{fields.fixtures}</RowError>
      </div>
    </div>
  );
}
