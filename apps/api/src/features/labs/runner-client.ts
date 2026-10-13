import type { RunnerRequest, RunnerResponse } from '@mettle/shared';
import { env } from '../../config/env';

/** Longer than the worst case inside the runner: queue wait, build, every test. */
const TIMEOUT_MS = 150_000;

const failure = (error: string): RunnerResponse => ({ status: 'error', compile: null, tests: [], durationMs: 0, error });

/** Sends one job to the sandbox runner. Never throws; infrastructure trouble is a result. */
export async function runInSandbox(job: RunnerRequest): Promise<RunnerResponse> {
  try {
    const response = await fetch(`${env.RUNNER_URL}/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.RUNNER_TOKEN}` },
      body: JSON.stringify(job),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 503) return failure('The sandbox is busy. Try again in a moment.');
    if (!response.ok) return failure('The sandbox rejected this submission.');
    return (await response.json()) as RunnerResponse;
  } catch {
    return failure('The sandbox could not be reached. Try again in a moment.');
  }
}

export async function runnerHealth(): Promise<{ ok: boolean; active?: number; waiting?: number }> {
  try {
    const response = await fetch(`${env.RUNNER_URL}/health`, { signal: AbortSignal.timeout(4000) });
    return (await response.json()) as { ok: boolean; active?: number; waiting?: number };
  } catch {
    return { ok: false };
  }
}
