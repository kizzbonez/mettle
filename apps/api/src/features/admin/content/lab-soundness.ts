import type { RunnerStatus } from '@mettle/shared';

/**
 * A lab is sound when its reference solution passes every test and its starter
 * was run and fell short. A starter the sandbox could not run proves nothing,
 * and one that does not build would hand learners a file that cannot run.
 */
export function labIsSound(solution: RunnerStatus, starter: RunnerStatus): boolean {
  return solution === 'passed' && (starter === 'failed' || starter === 'timeout');
}
