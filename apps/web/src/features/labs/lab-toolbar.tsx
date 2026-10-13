'use client';

import { LAB_LANGUAGE_LABEL } from '@mettle/shared';
import { ArrowLeft, Check, CloudOff, Play, RotateCcw, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/design/primitives/button';
import { Hallmark } from '@/design/primitives/hallmark';
import { cn } from '@/lib/cn';
import type { LabDetail } from '@/types/assessment';
import type { DraftStatus } from './use-draft';

const DRAFT_LABEL: Record<DraftStatus, string> = {
  saved: 'Draft saved',
  unsaved: 'Editing…',
  saving: 'Saving…',
  error: 'Not saved',
};

function DraftIndicator({ status }: { status: DraftStatus }) {
  return (
    <span className={cn('label-spec hidden items-center gap-1.5 md:flex', status === 'error' ? 'text-[#f0747c]' : 'text-forge-muted')} aria-live="polite">
      {status === 'error' ? <CloudOff className="size-3.5" /> : status === 'saved' ? <Check className="size-3.5" /> : null}
      {DRAFT_LABEL[status]}
    </span>
  );
}

interface LabToolbarProps {
  data: LabDetail;
  passed: boolean;
  draft: DraftStatus;
  pending: 'run' | 'submit' | null;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
}

/** The bar across the top of the workspace: where you are, and the two actions that matter. */
export function LabToolbar({ data, passed, draft, pending, onRun, onSubmit, onReset }: LabToolbarProps) {
  const busy = pending !== null;
  // A practice lab belongs to a lesson, so its way back is the lesson.
  const back = data.lesson ? { href: `/lessons/${data.lesson.id}`, label: 'Back to the lesson' } : { href: `/courses/${data.course.id}`, label: 'Back to the level' };
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-forge-rule bg-forge-2 px-3 py-2.5 sm:px-4">
      <Link href={back.href} className="grid size-9 shrink-0 place-items-center text-forge-muted hover:bg-forge-3 hover:text-white" aria-label={back.label} title={back.label}>
        <ArrowLeft className="size-5" />
      </Link>
      <Hallmark level={data.course.level} size="sm" muted={!passed} className={passed ? 'animate-stamp' : undefined} />
      <div className="min-w-0 flex-1">
        <p className="label-spec truncate text-forge-muted">{data.track.title} · {data.course.title}</p>
        <h1 className="truncate text-[15px] font-semibold text-white">{data.lab.title}</h1>
      </div>
      {passed ? <span className="label-spec hidden items-center gap-1 border border-patina bg-patina/20 px-2 py-1 text-[#4fc3a1] sm:flex"><Check className="size-3.5" strokeWidth={3} /> Passed</span> : null}
      <span className="label-spec hidden border border-forge-rule px-2 py-1 text-[#ff9d5c] sm:block">{LAB_LANGUAGE_LABEL[data.lab.language]}</span>
      <DraftIndicator status={draft} />
      <Button variant="forge" size="sm" onClick={onReset} disabled={busy} icon={<RotateCcw className="size-4" />} title="Reset to the starter code">
        <span className="hidden xl:inline">Reset</span>
      </Button>
      <Button variant="forge" size="sm" onClick={onRun} loading={pending === 'run'} disabled={busy} icon={pending === 'run' ? undefined : <Play className="size-4" />} title="Run the sample test (Ctrl+Enter)">
        Run
      </Button>
      <Button size="sm" onClick={onSubmit} loading={pending === 'submit'} disabled={busy} className="shadow-[0_2px_0_0_#7a2d05]" icon={pending === 'submit' ? undefined : <Send className="size-4" />} title="Run every test (Ctrl+Shift+Enter)">
        Submit
      </Button>
    </header>
  );
}
