import { Check, ChevronRight, X } from 'lucide-react';
import { Notice } from '@/design/patterns/notice';
import { StatusBadge } from '@/design/primitives/badge';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import type { LabVerdict, VerifyRun, VerifyTest } from '@/types/content-admin';

function Output({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="mt-2">
      <p className="label-spec text-steel">{label}</p>
      <pre className="mt-1 max-h-56 overflow-auto rounded-plate border border-forge-rule bg-forge p-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-forge-text">{text.trimEnd()}</pre>
    </div>
  );
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <span className={cn('grid size-5 shrink-0 place-items-center text-white', ok ? 'bg-patina' : 'bg-crimson')}>
      {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
    </span>
  );
}

/** One test: pass or fail, its name and time, and what it printed when it failed. */
function TestRow({ test, expanded }: { test: VerifyTest; expanded: boolean }) {
  const head = (
    <>
      <Mark ok={test.passed} />
      <span className={cn('label-spec w-20 shrink-0', test.passed ? 'text-patina' : 'text-crimson')}>{test.passed ? 'Pass' : test.timedOut ? 'Timed out' : 'Fail'}</span>
      <span className="min-w-0 flex-1">{test.name}</span>
      <span className="shrink-0 text-[13px] text-steel tabular-nums">{formatDuration(test.durationMs)}</span>
    </>
  );
  if (test.passed || !(test.stderr.trim() || test.stdout.trim())) return <li className="flex items-center gap-3 px-4 py-2.5 text-sm">{head}</li>;
  return (
    <li>
      <details className="group" open={expanded}>
        <summary className="flex list-none items-center gap-3 px-4 py-2.5 text-sm hover:bg-rule-soft/50 [&::-webkit-details-marker]:hidden">
          {head}
          <ChevronRight className="size-4 shrink-0 text-steel transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <div className="px-4 pb-3 pl-12">
          <Output label="Error output" text={test.stderr} />
          <Output label="Output" text={test.stdout} />
        </div>
      </details>
    </li>
  );
}

interface RunPanelProps {
  title: string;
  run: VerifyRun;
  /** Whether this run did what a sound lab needs of it. */
  ok: boolean;
  /** The finding, in words. */
  finding: string;
  /** Show each failing test's output without a click. Off for the starter, whose failures are expected. */
  expanded: boolean;
}

function RunPanel({ title, run, ok, finding, expanded }: RunPanelProps) {
  const passed = run.tests.filter((test) => test.passed).length;
  return (
    <section aria-label={title} className="min-w-0 rounded-plate border border-rule bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <div className="flex items-center gap-3 text-[13px] text-steel tabular-nums">
          {run.tests.length > 0 ? <span>{passed} of {run.tests.length} passed</span> : null}
          <span>{formatDuration(run.durationMs)}</span>
          <StatusBadge status={run.status} />
        </div>
      </div>
      <p className={cn('flex items-start gap-2.5 border-b border-rule-soft px-4 py-2.5 text-sm font-medium', ok ? 'text-patina' : 'text-crimson')}>
        <Mark ok={ok} /> {finding}
      </p>
      {run.error ? <div className="px-4 py-3"><Notice tone="error" title="The sandbox reported a problem">{run.error}</Notice></div> : null}
      {run.compileOutput ? <div className="px-4 pb-3"><Output label={run.status === 'compile_error' ? 'Compiler output' : 'Compiler warnings'} text={run.compileOutput} /></div> : null}
      {run.tests.length > 0 ? (
        <ul className="divide-y divide-rule-soft">{run.tests.map((test, index) => <TestRow key={`${index}-${test.name}`} test={test} expanded={expanded} />)}</ul>
      ) : null}
    </section>
  );
}

const SOLUTION_FINDING: Record<VerifyRun['status'], string> = {
  passed: 'Passes every test, as it must.',
  failed: 'Fails at least one of its own tests.',
  compile_error: 'Does not build, so no test ran.',
  timeout: 'Ran out of time.',
  error: 'The sandbox could not run it.',
};

const STARTER_FINDING: Record<VerifyRun['status'], string> = {
  passed: 'Already passes every test, so there is nothing left for the learner to do.',
  failed: 'Builds, and does not pass: the learner has work to do.',
  compile_error: 'Does not build. Learners would start from a file that cannot run.',
  timeout: 'Builds, and does not pass: it ran out of time.',
  error: 'The sandbox could not run it, so the starter was not checked.',
};

/** The outcome of a sandbox check: the verdict, then the two runs it rests on. */
export function VerifyVerdict({ verdict }: { verdict: LabVerdict }) {
  const { solution, starter } = verdict;
  const summary = verdict.sound
    ? 'The reference solution passes every test, and the starter builds but does not pass. The lab can be solved, and is not solved already.'
    : 'A lab is sound when the reference solution passes every test and the starter builds but does not pass. See below for what fell short.';
  return (
    <div className="space-y-5">
      <Notice tone={verdict.sound ? 'success' : 'error'} title={verdict.sound ? 'Sound' : 'Not sound'}>{summary}</Notice>
      <div className="grid gap-5 xl:grid-cols-2">
        <RunPanel title="Reference solution" run={solution} ok={solution.status === 'passed'} finding={SOLUTION_FINDING[solution.status]} expanded />
        <RunPanel title="Starter code" run={starter} ok={starter.status === 'failed' || starter.status === 'timeout'} finding={STARTER_FINDING[starter.status]} expanded={false} />
      </div>
    </div>
  );
}
