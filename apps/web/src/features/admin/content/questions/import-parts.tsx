'use client';

import { FileUp } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { TextAreaField } from '@/design/primitives/field';
import { errorMessage, fieldErrors } from '@/lib/api';
import { excerpt } from '../shared/labels';
import { IMPORT_EXAMPLE, importFaults, type ParsedImport } from './import-parse';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Where the questions come from: pasted into the box, or read into it from a file. */
export function ImportSource({ text, onText }: { text: string; onText: (text: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');

  async function read(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    if (chosen.size > MAX_FILE_BYTES) return setProblem(`${chosen.name} is larger than 8 MB, the most one import can carry.`);
    setProblem('');
    onText(await chosen.text());
  }

  return (
    <div className="space-y-2">
      <TextAreaField label="Questions as JSON" value={text} onChange={(event) => onText(event.target.value)} spellCheck={false}
        placeholder={'[\n  { "type": "single", "difficulty": "basic", "promptMd": "…", "options": [ … ] }\n]'}
        className="h-56 font-mono text-[13px]!" error={problem || undefined} />
      <div className="flex flex-wrap items-center gap-2">
        <input ref={file} type="file" accept=".json,application/json" onChange={(event) => void read(event)} className="sr-only" tabIndex={-1} aria-label="JSON file to import" />
        <Button size="sm" variant="secondary" onClick={() => file.current?.click()} icon={<FileUp className="size-4" />}>Choose a file</Button>
        <Button size="sm" variant="ghost" onClick={() => onText(IMPORT_EXAMPLE)}>Insert an example</Button>
      </div>
    </div>
  );
}

/** What the pasted text amounts to: how many questions, or why it cannot be read. */
export function ImportCount({ parsed }: { parsed: ParsedImport | null }) {
  if (!parsed) return <p className="text-sm text-steel">Paste a JSON array above or choose a file. Nothing is sent until you import.</p>;
  if (!parsed.ok) return <Notice tone="warning" title="This cannot be imported yet">{parsed.problem}</Notice>;
  const count = parsed.questions.length;
  return (
    <p className="flex items-baseline gap-3 text-sm text-ink-2" role="status">
      <span className="display text-4xl text-ink tabular-nums">{count.toLocaleString()}</span>
      {count === 1 ? 'question will be imported.' : 'questions will be imported.'}
    </p>
  );
}

/** The fields each question takes, for someone preparing a file. */
export function ImportShape() {
  return (
    <details className="rounded-plate border border-rule bg-white text-sm">
      <summary className="px-4 py-2.5 font-semibold text-ink">What each question needs</summary>
      <dl className="grid gap-x-4 gap-y-1.5 border-t border-rule px-4 py-3 text-[13px] text-ink-2 sm:grid-cols-[9rem_1fr]">
        <dt className="font-mono">type</dt><dd>single, multiple or true_false</dd>
        <dt className="font-mono">difficulty</dt><dd>basic, medium, advanced or professional</dd>
        <dt className="font-mono">promptMd</dt><dd>The question, in Markdown</dd>
        <dt className="font-mono">options</dt><dd>2 to 8 of {'{ "bodyMd": "…", "isCorrect": true }'}. One correct for single and true_false (which has exactly two options), at least two for multiple.</dd>
        <dt className="font-mono">explanationMd</dt><dd>Optional. Shown in the review after grading.</dd>
        <dt className="font-mono">tags</dt><dd>Optional. Up to 12 short strings.</dd>
        <dt className="font-mono">status</dt><dd>Optional: draft (the default), published or archived</dd>
        <dt className="font-mono">trackId, categoryId</dt><dd>Optional ids. A question without them gets the track and category chosen below.</dd>
      </dl>
    </details>
  );
}

/** The server's refusal, question by question, so the file can be fixed. */
export function ImportRejected({ error, questions }: { error: unknown; questions: Record<string, unknown>[] }) {
  if (!error) return null;
  const faults = importFaults(fieldErrors(error));
  if (faults.length === 0) return <Notice tone="error" title="Nothing was imported">{errorMessage(error)}</Notice>;
  return (
    <Notice tone="error" title="Nothing was imported">
      <p>The server rejected the file because of {faults.length === 1 ? 'this problem' : `these ${faults.length} problems`}. Fix {faults.length === 1 ? 'it' : 'them'} and import again.</p>
      <ul className="mt-2 space-y-2">
        {faults.map((fault) => {
          const prompt = questions[Number(fault.where.replace(/\D/g, '')) - 1]?.promptMd;
          return (
            <li key={`${fault.where}-${fault.part}`}>
              <span className="font-semibold">{fault.where}</span>{fault.part ? <span className="font-mono text-[13px]"> · {fault.part}</span> : null}: {fault.message}
              {typeof prompt === 'string' && prompt ? <span className="block text-[13px] opacity-80">“{excerpt(prompt, 90)}”</span> : null}
            </li>
          );
        })}
      </ul>
    </Notice>
  );
}
