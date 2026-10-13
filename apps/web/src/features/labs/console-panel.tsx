'use client';

import { Check, ChevronRight, Lock, Terminal, TriangleAlert, X } from 'lucide-react';
import { Spinner } from '@/design/primitives/spinner';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import type { Submission, TestResult } from '@/types/assessment';
import type { SubmissionState } from './use-submission';

const GREEN = 'text-[#4fc3a1]';
const RED = 'text-[#f0747c]';
const AMBER = 'text-[#ffb37a]';

function Output({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="mt-2">
      <p className="label-spec text-forge-muted">{label}</p>
      <pre className="mt-1 max-h-56 overflow-auto border border-forge-rule bg-[#0a0d0f] p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap text-forge-text">{text.trimEnd()}</pre>
    </div>
  );
}

function ResultRow({ result }: { result: TestResult }) {
  const detail = !result.hidden && (result.stdout?.trim() || result.stderr?.trim());
  const head = (
    <>
      <span className={cn('grid size-5 shrink-0 place-items-center', result.passed ? 'bg-patina text-white' : 'bg-crimson text-white')}>
        {result.passed ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
      </span>
      <span className={cn('label-spec w-10 shrink-0', result.passed ? GREEN : RED)}>{result.passed ? 'Pass' : result.timedOut ? 'Time' : 'Fail'}</span>
      <span className="min-w-0 flex-1 truncate text-forge-text">{result.name}</span>
      {result.hidden ? <Lock className="size-3.5 shrink-0 text-forge-muted" aria-label="Hidden test" /> : null}
      <span className="shrink-0 text-forge-muted tabular-nums">{formatDuration(result.durationMs)}</span>
    </>
  );
  return (
    <li className="border-b border-forge-rule/60 last:border-b-0">
      {detail ? (
        <details className="group" open={!result.passed}>
          <summary className="flex list-none items-center gap-3 px-4 py-2.5 hover:bg-forge-2 [&::-webkit-details-marker]:hidden">
            {head}
            <ChevronRight className="size-4 shrink-0 text-forge-muted transition-transform group-open:rotate-90" />
          </summary>
          <div className="px-4 pb-3 pl-12">
            {result.message ? <p className={cn('text-[13px]', RED)}>{result.message}</p> : null}
            <Output label="Output" text={result.stdout ?? ''} />
            <Output label="Errors" text={result.stderr ?? ''} />
          </div>
        </details>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-2.5">{head}</div>
          {result.message ? <p className={cn('px-4 pb-3 pl-12 text-[13px]', RED)}>{result.message}</p> : null}
        </>
      )}
    </li>
  );
}

function summaryLine(submission: Submission): { text: string; tone: string } {
  const took = formatDuration(submission.durationMs);
  if (submission.status === 'compile_error') return { text: 'Did not build. Nothing was run.', tone: RED };
  if (submission.status === 'error') return { text: submission.errorMessage ?? 'The sandbox could not run this.', tone: AMBER };
  const count = `${submission.passedCount} / ${submission.totalCount} passed`;
  return { text: took ? `${count} · ${took}` : count, tone: submission.status === 'passed' ? GREEN : AMBER };
}

function Finished({ submission }: { submission: Submission }) {
  const summary = summaryLine(submission);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-forge-rule px-4 py-2.5">
        <span className={cn('font-semibold', summary.tone)}>{summary.text}</span>
        <span className="label-spec text-forge-muted">{submission.kind === 'run' ? 'Run · sample tests' : 'Submit · all tests'}</span>
      </div>
      {submission.status === 'compile_error' ? (
        <div className="px-4 py-3"><Output label="Compiler" text={submission.compileOutput} /></div>
      ) : (
        <ul>{submission.results.map((result) => <ResultRow key={result.name} result={result} />)}</ul>
      )}
      {submission.status !== 'compile_error' && submission.compileOutput ? (
        <div className="px-4 pb-3"><Output label="Compiler warnings" text={submission.compileOutput} /></div>
      ) : null}
    </div>
  );
}

function Message({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex h-full min-h-24 flex-col items-center justify-center gap-3 px-6 text-center text-forge-muted">{icon}<p className="max-w-sm text-[13px] leading-relaxed">{children}</p></div>;
}

/** The lower-right pane: what the sandbox said about the last Run or Submit. */
export function ConsolePanel({ state }: { state: SubmissionState }) {
  const { submission, pending, error } = state;
  if (error) return <Message icon={<TriangleAlert className="size-6 text-[#ffb37a]" />}>{error}</Message>;
  if (pending) {
    const running = submission?.status === 'running';
    return (
      <Message icon={<Spinner className="size-6 text-ember" />}>
        <span className="text-forge-text">{running ? 'Building and running the tests…' : 'Waiting for a sandbox…'}</span>
        <br />A fresh container with no network is started for every {pending === 'run' ? 'run' : 'submission'}.
      </Message>
    );
  }
  if (submission) return <Finished submission={submission} />;
  return (
    <Message icon={<Terminal className="size-6" />}>
      <span className="text-forge-text">Run</span> tries your code against the sample test and shows its output.{' '}
      <span className="text-forge-text">Submit</span> runs every test, including the hidden ones.
    </Message>
  );
}
