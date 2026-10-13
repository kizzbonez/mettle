'use client';

import { levelInfo } from '@mettle/shared';
import { Check, Pin } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/design/primitives/badge';
import { Button } from '@/design/primitives/button';
import { Checkbox, TextField } from '@/design/primitives/field';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { PinnedQuestion, QuestionRow } from '@/types/content-admin';
import { excerpt, TYPE_LABEL } from '../shared/labels';
import { useDebounced } from '../shared/use-debounced';
import { MAX_PINNED } from './exam-model';
import { PinnedList } from './pinned-list';

const SHOWN = 8;

interface ResultProps {
  question: QuestionRow;
  pinned: boolean;
  full: boolean;
  onPin: () => void;
}

function Result({ question, pinned, full, onPin }: ResultProps) {
  return (
    <li className="flex items-start gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug">{excerpt(question.promptMd, 160)}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-steel">
          {levelInfo(question.difficulty).label} · {TYPE_LABEL[question.type]}{question.trackTitle ? ` · ${question.trackTitle}` : ''}
          {question.status !== 'published' ? <StatusBadge status={question.status} /> : null}
        </p>
      </div>
      <Button size="sm" variant="secondary" disabled={pinned || full} onClick={onPin} aria-label={`${pinned ? 'Pinned' : 'Pin'}: ${excerpt(question.promptMd, 60)}`}
        icon={pinned ? <Check className="size-4" /> : <Pin className="size-4" />}>{pinned ? 'Pinned' : 'Pin'}</Button>
    </li>
  );
}

interface QuestionPickerProps {
  pinned: PinnedQuestion[];
  /** Limits the search to the exam's track unless the author widens it. */
  examTrackId: string;
  error?: string;
  onChange: (pinned: PinnedQuestion[]) => void;
}

/** For a fixed exam: search the bank on the left, pin questions into the paper on the right. */
export function QuestionPicker({ pinned, examTrackId, error, onChange }: QuestionPickerProps) {
  const [text, setText] = useState('');
  const [inTrack, setInTrack] = useState(true);
  const q = useDebounced(text.trim(), 300);
  const params = new URLSearchParams({ pageSize: String(SHOWN), sort: 'updatedAt', order: 'desc' });
  if (q) params.set('q', q);
  if (inTrack && examTrackId) params.set('trackId', examTrackId);
  const { data, error: failure } = useApi<Page<QuestionRow>>(`/admin/questions?${params.toString()}`, { keepPreviousData: true });
  const taken = new Set(pinned.map((question) => question.id));
  const pin = ({ id, promptMd, status }: QuestionRow) => onChange([...pinned, { id, promptMd, status }]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-label="Find questions" className="min-w-0 space-y-3">
        {/* Enter here means "search", which already happens as you type; it must not save the exam. */}
        <TextField label="Search the bank" type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Words from the question"
          onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} />
        <Checkbox label="Only questions in this exam's track" checked={inTrack} onChange={(event) => setInTrack(event.target.checked)} disabled={!examTrackId} />
        {failure ? <p role="alert" className="text-sm font-medium text-crimson">{failure.message}</p> : null}
        {data && data.items.length === 0 ? <p className="border border-dashed border-steel-2 px-4 py-6 text-center text-sm text-steel">No question matches.</p> : null}
        {data && data.items.length > 0 ? (
          <ul className="divide-y divide-rule-soft border border-rule bg-white" aria-busy={q !== text.trim()}>
            {data.items.map((question) => (
              <Result key={question.id} question={question} pinned={taken.has(question.id)} full={pinned.length >= MAX_PINNED} onPin={() => pin(question)} />
            ))}
          </ul>
        ) : null}
        {data && data.total > data.items.length ? (
          <p className="text-[13px] text-steel">Showing the {data.items.length} most recently updated of {data.total.toLocaleString()} matches. Search to narrow them down.</p>
        ) : null}
      </section>
      <PinnedList pinned={pinned} onChange={onChange} error={error} />
    </div>
  );
}
