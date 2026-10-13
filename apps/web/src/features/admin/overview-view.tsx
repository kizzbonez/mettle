'use client';

import { Activity, ClipboardCheck, FlaskConical, Users } from 'lucide-react';
import { useState } from 'react';
import { LoadState } from '@/design/patterns/load-state';
import { PageHeader, StatTile } from '@/design/patterns/page-header';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { formatPercent } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { AdminMetrics } from '@/types/admin';
import { ColumnChart } from './charts/column-chart';
import { LineChart } from './charts/line-chart';
import { shortDay } from './charts/scale';
import { PassRates, RecentSignups, SandboxStatus, TopCourses } from './overview-panels';

function Headline({ metrics }: { metrics: AdminMetrics }) {
  const { users, submissions } = metrics;
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatTile label="Active users" value={users.activeLast7Days.toLocaleString()} hint={`In the last 7 days, of ${users.total.toLocaleString()} accounts`} icon={<Activity className="size-4" />} />
      <StatTile label="Total submissions" value={submissions.total.toLocaleString()} hint={`${submissions.exams.total.toLocaleString()} exams · ${submissions.labs.total.toLocaleString()} labs`} icon={<FlaskConical className="size-4" />} />
      <StatTile label="Exam pass rate" value={formatPercent(submissions.exams.passRate)} hint={`${submissions.exams.passed.toLocaleString()} passed`} icon={<ClipboardCheck className="size-4" />} />
      <StatTile label="New accounts" value={users.newLast30Days.toLocaleString()} hint={`In the last 30 days${users.banned ? ` · ${users.banned} suspended` : ''}`} icon={<Users className="size-4" />} />
    </div>
  );
}

/** The same numbers as the charts, for screen readers and for anyone who wants the figures. */
function SeriesTable({ series }: { series: AdminMetrics['series'] }) {
  return (
    <div className="max-h-72 overflow-y-auto border-t border-rule">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-rule-soft text-left">
          <tr>{['Day', 'Exam attempts', 'Lab submissions', 'Sign-ups'].map((head) => <th key={head} className="label-spec px-5 py-2 font-medium text-steel">{head}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-rule-soft tabular-nums">
          {[...series].reverse().map((row) => (
            <tr key={row.day}><td className="px-5 py-1.5">{shortDay(row.day)}</td><td className="px-5">{row.exams}</td><td className="px-5">{row.labs}</td><td className="px-5">{row.signups}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityPlate({ series }: { series: AdminMetrics['series'] }) {
  const [table, setTable] = useState(false);
  const days = series.map((row) => row.day);
  return (
    <Plate>
      <PlateHeader
        title="Graded work per day"
        caption="Last 30 days, UTC."
        action={<button type="button" onClick={() => setTable((shown) => !shown)} className="label-spec border border-rule px-2 py-1 text-steel hover:border-ink hover:text-ink" aria-pressed={table}>{table ? 'Show chart' : 'Show table'}</button>}
      />
      {table ? (
        <SeriesTable series={series} />
      ) : (
        <div className="p-5">
          <LineChart days={days} label="Exam attempts and lab submissions per day over the last 30 days"
            series={[
              { name: 'Exam attempts', color: 'var(--color-chart-1)', values: series.map((row) => row.exams) },
              { name: 'Lab submissions', color: 'var(--color-chart-2)', values: series.map((row) => row.labs) },
            ]} />
        </div>
      )}
    </Plate>
  );
}

function Overview({ metrics }: { metrics: AdminMetrics }) {
  const days = metrics.series.map((row) => row.day);
  return (
    <div className="space-y-8">
      <Headline metrics={metrics} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <ActivityPlate series={metrics.series} />
          <Plate>
            <PlateHeader title="Sign-ups per day" caption="Last 30 days, UTC." />
            <div className="p-5"><ColumnChart days={days} values={metrics.series.map((row) => row.signups)} unit="Sign-ups" label="New accounts per day over the last 30 days" /></div>
          </Plate>
        </div>
        <div className="space-y-8">
          <PassRates submissions={metrics.submissions} />
          <TopCourses courses={metrics.topCourses} />
          <RecentSignups users={metrics.recentSignups} />
        </div>
      </div>
    </div>
  );
}

export function OverviewView() {
  const { data, error, mutate } = useApi<AdminMetrics>('/admin/metrics', { refreshInterval: 60_000 });
  const { content } = data ?? {};
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        description={content ? `${content.tracks} tracks · ${content.courses} levels · ${content.lessons} lessons · ${content.questions.toLocaleString()} questions · ${content.labs} labs` : undefined}
        actions={data ? <SandboxStatus sandbox={data.sandbox} /> : null}
      />
      <LoadState data={data} error={error} onRetry={() => void mutate()}>
        {(metrics) => <Overview metrics={metrics} />}
      </LoadState>
    </>
  );
}
