import type { RunnerStatus, RunnerTestResult } from '@mettle/shared';
import type { ExecResult } from './docker/exec';

/**
 * A test passes only when it exits 0, inside its time limit, and the harness
 * printed the per-run nonce after the test body returned. The exit code alone
 * is not enough: code under test can call `exit(0)` before any assertion runs.
 */
export function judgeTest(id: string, output: ExecResult, nonce: string): RunnerTestResult {
  const reachedEnd = output.stdoutTail.trimEnd().endsWith(nonce);
  const visible = output.stdout.split(nonce).join('').trimEnd();
  return {
    id,
    stdout: visible,
    stderr: output.stderr,
    exitCode: output.exitCode,
    durationMs: output.durationMs,
    timedOut: output.timedOut,
    passed: reachedEnd && output.exitCode === 0 && !output.timedOut,
  };
}

export function overallStatus(tests: RunnerTestResult[]): RunnerStatus {
  if (tests.every((test) => test.passed)) return 'passed';
  return tests.some((test) => test.timedOut) ? 'timeout' : 'failed';
}
