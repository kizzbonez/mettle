'use client';

import { Eye, FileText, Lock } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/design/patterns/markdown';
import { StatusBadge } from '@/design/primitives/badge';
import { Tabs, type TabItem } from '@/design/primitives/tabs';
import { formatDuration, timeAgo } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { LabDetail, SubmissionRow } from '@/types/assessment';

type Tab = 'brief' | 'tests' | 'files' | 'history';

function Brief({ lab }: { lab: LabDetail['lab'] }) {
  return (
    <div className="space-y-7">
      <section>
        <p className="label-spec mb-3 text-ember">Scenario</p>
        <Markdown forge>{lab.scenarioMd}</Markdown>
      </section>
      <section>
        <p className="label-spec mb-3 text-ember">Your task</p>
        <Markdown forge>{lab.instructionsMd}</Markdown>
      </section>
      <p className="label-spec border-t border-forge-rule pt-4 text-forge-muted">
        Limits · {lab.timeLimitMs / 1000} s per test · {lab.memoryMb} MB · no network
      </p>
    </div>
  );
}

function Tests({ lab }: { lab: LabDetail['lab'] }) {
  return (
    <ol className="space-y-4">
      {lab.tests.map((test, index) => (
        <li key={test.id} className="border border-forge-rule bg-forge-2">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="display text-xl text-forge-muted">{String(index + 1).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1 text-sm font-medium text-forge-text">{test.name}</span>
            <span className="label-spec flex shrink-0 items-center gap-1.5 text-forge-muted">
              {test.hidden ? <><Lock className="size-3.5" /> Hidden</> : <><Eye className="size-3.5" /> Sample</>}
            </span>
          </div>
          {test.code ? (
            <pre className="overflow-x-auto border-t border-forge-rule bg-[#0a0d0f] p-4 font-mono text-[12.5px] leading-relaxed text-forge-text">{test.code}</pre>
          ) : (
            <p className="border-t border-forge-rule px-4 py-3 text-[13px] text-forge-muted">
              Runs on Submit. You will see whether it passed, how long it took, and what it was checking.
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function Files({ fixtures }: { fixtures: LabDetail['lab']['fixtures'] }) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-forge-muted">Read-only files placed next to your code in the sandbox.</p>
      {fixtures.map((file) => (
        <div key={file.path} className="border border-forge-rule">
          <p className="label-spec flex items-center gap-2 border-b border-forge-rule bg-forge-2 px-4 py-2 text-forge-text">
            <FileText className="size-3.5" /> {file.path}
          </p>
          <pre className="max-h-80 overflow-auto bg-[#0a0d0f] p-4 font-mono text-[12px] leading-relaxed text-forge-text">{file.content}</pre>
        </div>
      ))}
    </div>
  );
}

function History({ labId, refreshKey }: { labId: string; refreshKey: number }) {
  const { data } = useApi<{ submissions: SubmissionRow[] }>(`/labs/${labId}/submissions?n=${refreshKey}`);
  if (!data) return <p className="text-[13px] text-forge-muted">Loading…</p>;
  if (data.submissions.length === 0) return <p className="text-[13px] text-forge-muted">You have not run anything yet.</p>;
  return (
    <ul className="divide-y divide-forge-rule border border-forge-rule">
      {data.submissions.map((row) => (
        <li key={row.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
          <span className="label-spec w-14 text-forge-muted">{row.kind}</span>
          <StatusBadge status={row.status} />
          <span className="text-forge-text tabular-nums">{row.passedCount}/{row.totalCount}</span>
          <span className="text-forge-muted tabular-nums">{formatDuration(row.durationMs)}</span>
          <span className="ml-auto text-forge-muted">{timeAgo(row.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

interface BriefPanelProps {
  lab: LabDetail['lab'];
  /** Changes after each run, so the history tab reloads. */
  refreshKey: number;
}

/** The left pane: what to build, how it will be checked, and what you have tried. */
export function BriefPanel({ lab, refreshKey }: BriefPanelProps) {
  const [tab, setTab] = useState<Tab>('brief');
  const items: TabItem<Tab>[] = [
    { key: 'brief', label: 'Brief' },
    { key: 'tests', label: 'Tests', count: lab.tests.length },
    ...(lab.fixtures.length > 0 ? [{ key: 'files' as const, label: 'Files', count: lab.fixtures.length }] : []),
    { key: 'history', label: 'History' },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs items={items} value={tab} onChange={setTab} forge className="shrink-0 px-3" />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === 'brief' ? <Brief lab={lab} /> : null}
        {tab === 'tests' ? <Tests lab={lab} /> : null}
        {tab === 'files' ? <Files fixtures={lab.fixtures} /> : null}
        {tab === 'history' ? <History labId={lab.id} refreshKey={refreshKey} /> : null}
      </div>
    </div>
  );
}
