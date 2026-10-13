'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DataTable, type Column } from '@/design/patterns/data-table';
import { PageHeader } from '@/design/patterns/page-header';
import { toQuery, useListState } from '@/design/patterns/use-list-state';
import { StatusBadge } from '@/design/primitives/badge';
import { Plate } from '@/design/primitives/plate';
import { Tabs, type TabItem } from '@/design/primitives/tabs';
import { useAuth } from '@/features/auth/auth-provider';
import { formatDateTime, formatPercent } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { ExamHistoryRow } from '@/types/assessment';
import { AccountPanel, PasswordPanel } from './account-panels';
import { SessionsPanel } from './sessions-panel';
import { SkillTreePanel } from './skill-tree';
import { TwoFactorPanel } from './two-factor-panel';

type Tab = 'progress' | 'history' | 'account' | 'security';

const TABS: TabItem<Tab>[] = [
  { key: 'progress', label: 'Skill tree' },
  { key: 'history', label: 'Exam history' },
  { key: 'account', label: 'Account' },
  { key: 'security', label: 'Security' },
];

const historyColumns: Column<ExamHistoryRow>[] = [
  { key: 'exam', header: 'Exam', render: (row) => <Link href={`/attempts/${row.id}`} className="font-medium hover:text-ember-deep hover:underline">{row.examTitle}</Link> },
  { key: 'track', header: 'Track', render: (row) => <span className="text-steel">{row.trackTitle}</span> },
  { key: 'score', header: 'Score', render: (row) => <span className="display text-xl tabular-nums">{formatPercent(row.scorePercent)}</span> },
  { key: 'correct', header: 'Correct', render: (row) => <span className="text-steel tabular-nums">{row.correctCount ?? 0} / {row.totalCount}</span> },
  { key: 'result', header: 'Result', render: (row) => <StatusBadge status={row.passed ? 'passed' : 'failed'} /> },
  { key: 'when', header: 'Taken', render: (row) => <span className="text-[13px] text-steel tabular-nums">{formatDateTime(row.submittedAt ?? row.startedAt)}</span> },
];

function ExamHistoryPanel() {
  const [state, setState] = useListState({ sort: 'startedAt', pageSize: 10 });
  const { data, error } = useApi<Page<ExamHistoryRow>>(`/me/exam-history?${toQuery(state)}`, { keepPreviousData: true });
  return (
    <Plate>
      <DataTable label="Exam history" columns={historyColumns} data={data} error={error} state={state} onState={setState} rowKey={(row) => row.id}
        empty={{ title: 'No exams taken yet', hint: 'Every graded attempt is kept here, with its questions and explanations.' }} />
    </Plate>
  );
}

export function ProfileView() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get('tab');
  const tab = TABS.some((item) => item.key === requested) ? (requested as Tab) : 'progress';

  return (
    <>
      <PageHeader eyebrow="Profile" title={user.displayName} description={user.email} />
      <Tabs items={TABS} value={tab} onChange={(key) => router.replace(`${pathname}?tab=${key}`, { scroll: false })} className="mb-8" />
      {tab === 'progress' ? <SkillTreePanel /> : null}
      {tab === 'history' ? <ExamHistoryPanel /> : null}
      {tab === 'account' ? <AccountPanel /> : null}
      {tab === 'security' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6"><TwoFactorPanel /><PasswordPanel /></div>
          <div className="self-start"><SessionsPanel /></div>
        </div>
      ) : null}
    </>
  );
}
