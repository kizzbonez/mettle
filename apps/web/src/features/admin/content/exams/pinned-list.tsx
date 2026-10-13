import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { Notice } from '@/design/patterns/notice';
import { StatusBadge } from '@/design/primitives/badge';
import type { PinnedQuestion } from '@/types/content-admin';
import { RowError } from '../shared/bare-field';
import { IconButton } from '../shared/icon-button';
import { excerpt } from '../shared/labels';
import { move, removeAt } from '../shared/lists';
import { MAX_PINNED } from './exam-model';

interface PinnedListProps {
  pinned: PinnedQuestion[];
  onChange: (pinned: PinnedQuestion[]) => void;
  error?: string;
}

/** The questions of a fixed exam, in the order every learner meets them. */
export function PinnedList({ pinned, onChange, error }: PinnedListProps) {
  const skipped = pinned.filter((question) => question.status !== 'published').length;
  return (
    <section aria-label="Pinned questions" className="min-w-0 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="label-spec text-ink-2">Pinned, in exam order</h3>
        <span className="text-[13px] text-steel tabular-nums">{pinned.length} of {MAX_PINNED}</span>
      </div>
      {pinned.length === 0 ? (
        <p className="border border-dashed border-steel-2 px-4 py-8 text-center text-sm text-steel">Nothing is pinned yet, so an attempt would have no questions. Search the bank and pin the ones this exam asks.</p>
      ) : (
        <ol className="divide-y divide-rule-soft border border-rule bg-white">
          {pinned.map((question, index) => {
            const name = `question ${index + 1}`;
            return (
              <li key={question.id} className="flex items-start gap-3 py-2 pr-1 pl-3">
                <span className="display w-7 shrink-0 pt-1 text-xl text-steel tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1 py-1">
                  <p className="line-clamp-2 text-sm leading-snug">{excerpt(question.promptMd, 160)}</p>
                  {question.status !== 'published' ? <p className="mt-1"><StatusBadge status={question.status} /></p> : null}
                </div>
                <div className="flex shrink-0">
                  <IconButton label={`Move ${name} up`} disabled={index === 0} onClick={() => onChange(move(pinned, index, -1))}><ArrowUp className="size-4" /></IconButton>
                  <IconButton label={`Move ${name} down`} disabled={index === pinned.length - 1} onClick={() => onChange(move(pinned, index, 1))}><ArrowDown className="size-4" /></IconButton>
                  <IconButton label={`Unpin ${name}`} onClick={() => onChange(removeAt(pinned, index))}><X className="size-4" /></IconButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {skipped > 0 ? (
        <Notice tone="warning">
          {skipped === 1 ? '1 pinned question is' : `${skipped} pinned questions are`} not published. Only published questions are dealt, so attempts would have {pinned.length - skipped} of these {pinned.length}.
        </Notice>
      ) : null}
      <RowError>{error}</RowError>
    </section>
  );
}
