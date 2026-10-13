'use client';

import { levelInfo } from '@mettle/shared';
import { ArrowRight, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadState } from '@/design/patterns/load-state';
import { Notice } from '@/design/patterns/notice';
import { PageHeader, StatTile } from '@/design/patterns/page-header';
import { StatusBadge } from '@/design/primitives/badge';
import { Button } from '@/design/primitives/button';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, formatPercent } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { AttemptSummary, ExamOverview as Overview } from '@/types/assessment';

function rules(exam: Overview['exam']): string[] {
  return [
    exam.mode === 'dynamic'
      ? 'The paper is drawn from the question bank when you start. A retake gets different questions.'
      : 'Every attempt gets the same questions, with the options in a new order.',
    'Your answers are saved as you go. If you close the tab, you can come back to the same paper.',
    `The clock does not stop. After ${exam.timeLimitMinutes} minutes the paper is graded with whatever you have answered.`,
    'A question is correct only if every right option is selected and nothing else. There is no partial credit.',
    'Answers and explanations are shown after you submit.',
  ];
}

function History({ attempts }: { attempts: AttemptSummary[] }) {
  return (
    <Plate>
      <PlateHeader title="Your attempts" />
      <ul className="divide-y divide-rule-soft">
        {attempts.map((attempt) => (
          <li key={attempt.id}>
            <Link href={`/attempts/${attempt.id}`} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-white">
              <span className="display w-16 text-3xl tabular-nums">{formatPercent(attempt.scorePercent)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{attempt.correctCount ?? 0} of {attempt.totalCount} correct</span>
                <span className="label-spec text-steel">{formatDateTime(attempt.submittedAt ?? attempt.startedAt)}</span>
              </span>
              <StatusBadge status={attempt.passed ? 'passed' : 'failed'} />
              <span className="text-sm font-semibold text-steel group-hover:text-ink">Review</span>
            </Link>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

function StartPanel({ data }: { data: Overview }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { exam, liveAttemptId, attempts } = data;
  const left = exam.maxAttempts === null ? null : Math.max(0, exam.maxAttempts - attempts.length);
  const exhausted = left === 0 && !liveAttemptId;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { attemptId } = await api.post<{ attemptId: string }>(`/exams/${exam.id}/attempts`);
      router.push(`/attempts/${attemptId}`);
    } catch (cause) {
      setError(cause);
      setBusy(false);
    }
  }

  return (
    <Plate className="p-6">
      <h2 className="text-lg font-semibold">{liveAttemptId ? 'You have a paper in progress' : attempts.length ? 'Ready for another go?' : 'Ready when you are'}</h2>
      <ul className="mt-4 space-y-2.5">
        {rules(exam).map((rule) => (
          <li key={rule} className="flex gap-3 text-sm leading-relaxed text-ink-2">
            <span className="mt-2.5 h-0.5 w-2 shrink-0 bg-ember" aria-hidden />
            {rule}
          </li>
        ))}
      </ul>
      {error ? <Notice tone="error" className="mt-5">{errorMessage(error)}</Notice> : null}
      {exhausted ? <Notice tone="warning" className="mt-5">You have used every attempt for this exam.</Notice> : null}
      <Button size="lg" className="mt-6" loading={busy} disabled={exhausted} onClick={start}
        icon={busy ? undefined : liveAttemptId ? <ArrowRight className="size-4" /> : attempts.length ? <RotateCcw className="size-4" /> : <Play className="size-4" />}>
        {liveAttemptId ? 'Resume the exam' : attempts.length ? 'Take it again' : 'Start the exam'}
      </Button>
    </Plate>
  );
}

export function ExamOverview({ examId }: { examId: string }) {
  const { data, error, mutate } = useApi<Overview>(`/exams/${examId}`);
  return (
    <LoadState data={data} error={error} onRetry={() => void mutate()} what="exam">
      {(overview) => {
        const { exam, course, track, attempts } = overview;
        const best = attempts.reduce<number | null>((top, a) => (a.scorePercent !== null && (top === null || a.scorePercent > top) ? a.scorePercent : top), null);
        return (
          <>
            <PageHeader
              crumbs={[
                { label: 'Courses', href: '/courses' },
                course ? { label: `${track.title} · ${levelInfo(course.level).label}`, href: `/courses/${course.id}` } : { label: track.title },
                { label: 'Exam' },
              ]}
              title={exam.title}
              description={exam.description}
            />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile label="Questions" value={exam.questionCount} />
              <StatTile label="Time limit" value={<>{exam.timeLimitMinutes}<span className="ml-1 text-2xl text-steel">min</span></>} />
              <StatTile label="Pass mark" value={`${exam.passPercent}%`} />
              <StatTile label="Your best" value={formatPercent(best)} hint={exam.maxAttempts ? `${attempts.length} of ${exam.maxAttempts} attempts used` : `${attempts.length} attempts, unlimited`} />
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <StartPanel data={overview} />
              {attempts.length > 0 ? <History attempts={attempts} /> : null}
            </div>
          </>
        );
      }}
    </LoadState>
  );
}
