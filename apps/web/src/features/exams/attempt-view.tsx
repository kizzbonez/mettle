'use client';

import { LoadState } from '@/design/patterns/load-state';
import { refreshProgress, useApi } from '@/lib/use-api';
import type { Attempt } from '@/types/assessment';
import { ExamResult } from './exam-result';
import { ExamRunner } from './exam-runner';

/** One attempt: the live paper while it is open, the graded review once it is closed. */
export function AttemptView({ attemptId }: { attemptId: string }) {
  const { data, error, mutate } = useApi<Attempt>(`/attempts/${attemptId}`);
  return (
    <LoadState data={data} error={error} onRetry={() => void mutate()} what="attempt">
      {(attempt) =>
        attempt.status === 'in_progress' ? (
          <ExamRunner key={attempt.id} attempt={attempt} onFinished={(graded) => {
            void mutate(graded, { revalidate: false });
            void refreshProgress();
          }} />
        ) : (
          <ExamResult attempt={attempt} />
        )
      }
    </LoadState>
  );
}
