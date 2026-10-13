import { describe, expect, it } from 'vitest';
import { labIsSound } from './lab-soundness';

describe('labIsSound', () => {
  it('needs a passing solution and a starter that ran and fell short', () => {
    expect(labIsSound('passed', 'failed')).toBe(true);
    expect(labIsSound('passed', 'timeout')).toBe(true);
  });

  it('refuses a lab that is already solved, or whose starter does not build', () => {
    expect(labIsSound('passed', 'passed')).toBe(false);
    expect(labIsSound('passed', 'compile_error')).toBe(false);
  });

  it('does not call a lab sound when the sandbox could not run the starter', () => {
    expect(labIsSound('passed', 'error')).toBe(false);
  });

  it('refuses any lab whose solution does not pass', () => {
    for (const status of ['failed', 'compile_error', 'timeout', 'error'] as const) expect(labIsSound(status, 'failed')).toBe(false);
  });
});
