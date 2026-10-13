'use client';

import { LAB_SOLUTION_FILE } from '@mettle/shared';
import { ArrowRight, Terminal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { LoadState } from '@/design/patterns/load-state';
import { Button, ButtonLink } from '@/design/primitives/button';
import { Hallmark } from '@/design/primitives/hallmark';
import { Modal } from '@/design/primitives/modal';
import { Spinner } from '@/design/primitives/spinner';
import { refreshProgress, useApi } from '@/lib/use-api';
import type { LabDetail, Submission } from '@/types/assessment';
import { BriefPanel } from './brief-panel';
import { ConsolePanel } from './console-panel';
import { LabToolbar } from './lab-toolbar';
import { SplitPane } from './split-pane';
import { useDraft } from './use-draft';
import { useSubmission } from './use-submission';

// Monaco touches `window` as it loads, so it is only ever rendered in the browser.
const CodeEditor = dynamic(() => import('./code-editor').then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center"><Spinner className="text-ember" label="Loading the editor" /></div>,
});

function PassedBanner({ data }: { data: LabDetail }) {
  return (
    <div className="flex shrink-0 animate-rise items-center gap-4 border-b border-patina bg-patina px-5 py-3 text-white">
      <Hallmark level={data.course.level} size="md" className="animate-stamp" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Every test passed. This lab is done.</p>
        <p className="text-[13px] opacity-85">Your solution is saved. You can keep improving it; the pass stays.</p>
      </div>
      <ButtonLink href={`/courses/${data.course.id}`} variant="secondary" size="sm" icon={<ArrowRight className="order-last size-4" />}>Back to the level</ButtonLink>
    </div>
  );
}

function Workspace({ data }: { data: LabDetail }) {
  const { lab } = data;
  const draft = useDraft(lab.id, data.code);
  const [passed, setPassed] = useState(data.passed);
  const [justPassed, setJustPassed] = useState(false);
  const [runs, setRuns] = useState(0);
  const [resetting, setResetting] = useState(false);

  const onFinished = useCallback((submission: Submission) => {
    setRuns((count) => count + 1);
    if (submission.kind === 'submit' && submission.status === 'passed') {
      setPassed(true);
      setJustPassed(true);
      void refreshProgress();
    }
  }, []);
  const job = useSubmission(lab.id, onFinished);

  const start = useCallback(
    async (kind: 'run' | 'submit') => {
      if (job.pending) return;
      await draft.flush();
      await job.start(kind, draft.code);
    },
    [draft, job],
  );

  return (
    <div className="flex h-dvh flex-col bg-forge text-forge-text">
      <LabToolbar data={data} passed={passed} draft={draft.status} pending={job.pending}
        onRun={() => void start('run')} onSubmit={() => void start('submit')} onReset={() => setResetting(true)} />
      {justPassed ? <PassedBanner data={data} /> : null}
      <SplitPane direction="horizontal" initial={40} min={24} max={62} className="flex-1"
        first={<BriefPanel lab={lab} refreshKey={runs} />}
        second={
          <SplitPane direction="vertical" initial={62} min={25} max={85} className="h-[80dvh] lg:h-full"
            first={
              <div className="flex h-full flex-col">
                <p className="label-spec shrink-0 border-b border-forge-rule bg-forge-2 px-4 py-2 text-forge-muted">{LAB_SOLUTION_FILE[lab.language]}</p>
                <div className="min-h-0 flex-1">
                  <CodeEditor language={lab.language} value={draft.code} onChange={draft.update} onRun={() => void start('run')} onSubmit={() => void start('submit')} />
                </div>
              </div>
            }
            second={
              <div className="flex h-full flex-col">
                <p className="label-spec flex shrink-0 items-center gap-2 border-b border-forge-rule bg-forge-2 px-4 py-2 text-forge-muted"><Terminal className="size-3.5" /> Console</p>
                <div className="min-h-0 flex-1 overflow-y-auto font-mono text-[13px]" aria-live="polite"><ConsolePanel state={job} /></div>
              </div>
            }
          />
        }
      />
      <Modal open={resetting} onClose={() => setResetting(false)} title="Reset to the starter code?"
        description="Your current code is replaced by the original boilerplate. Past submissions are kept."
        footer={<>
          <Button variant="ghost" onClick={() => setResetting(false)}>Keep my code</Button>
          <Button variant="danger" onClick={() => { draft.update(lab.starterCode); setResetting(false); }}>Reset</Button>
        </>}>
        <p className="text-sm text-ink-2">This cannot be undone, so copy anything you want to keep first.</p>
      </Modal>
    </div>
  );
}

export function LabWorkspace({ labId }: { labId: string }) {
  // Loaded once: revalidating would overwrite what is being typed with the last saved draft.
  const { data, error, mutate } = useApi<LabDetail>(`/labs/${labId}`, { revalidateIfStale: false, revalidateOnReconnect: false });
  return (
    <LoadState data={data} error={error} onRetry={() => void mutate()} what="lab">
      {(lab) => <Workspace key={lab.lab.id} data={lab} />}
    </LoadState>
  );
}
