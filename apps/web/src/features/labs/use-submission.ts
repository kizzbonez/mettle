'use client';

import { FINAL_SUBMISSION_STATUSES } from '@mettle/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Submission } from '@/types/assessment';

const POLL_MS = 600;
const GIVE_UP_AFTER_MS = 3 * 60_000;

export interface SubmissionState {
  /** The latest result, or the job in flight. */
  submission: Submission | null;
  /** Which button started the job that is running, if any. */
  pending: 'run' | 'submit' | null;
  error: string | null;
  start: (kind: 'run' | 'submit', code: string) => Promise<void>;
}

const isFinal = (submission: Submission) => FINAL_SUBMISSION_STATUSES.includes(submission.status);

/** Polls a job until it is final, reporting each state. Stops quietly if the page has gone. */
async function follow(id: string, alive: { current: boolean }, onUpdate: (submission: Submission) => void): Promise<Submission | undefined> {
  const deadline = Date.now() + GIVE_UP_AFTER_MS;
  while (alive.current && Date.now() < deadline) {
    const current = await api.get<Submission>(`/submissions/${id}`);
    if (!alive.current) return undefined;
    onUpdate(current);
    if (isFinal(current)) return current;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  if (!alive.current) return undefined;
  throw new Error('The sandbox is taking too long. Try again in a moment.');
}

/**
 * Sends code to the sandbox and follows the job. The API answers at once with
 * a job id; this polls until the job reaches a final state.
 */
export function useSubmission(labId: string, onFinished: (submission: Submission) => void): SubmissionState {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [pending, setPending] = useState<'run' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const start = useCallback(
    async (kind: 'run' | 'submit', code: string) => {
      setPending(kind);
      setError(null);
      setSubmission(null);
      try {
        const { submissionId } = await api.post<{ submissionId: string }>(`/labs/${labId}/submissions`, { code, kind });
        const result = await follow(submissionId, alive, setSubmission);
        if (result) finished.current(result);
      } catch (cause) {
        if (alive.current) setError(cause instanceof Error && !('status' in cause) ? cause.message : errorMessage(cause));
      }
      if (alive.current) setPending(null);
    },
    [labId],
  );

  return { submission, pending, error, start };
}
