import { describe, expect, it } from 'vitest';
import type { ExecResult } from './docker/exec';
import { judgeTest, overallStatus } from './judge';

const NONCE = 'mettle-0123456789abcdef';

function output(overrides: Partial<ExecResult>): ExecResult {
  const stdout = overrides.stdout ?? `hello\n\n${NONCE}\n`;
  return {
    stdout,
    stdoutTail: stdout.slice(-256),
    stderr: '',
    exitCode: 0,
    durationMs: 12,
    timedOut: false,
    ...overrides,
  };
}

describe('judgeTest', () => {
  it('passes a clean exit that printed the nonce, and hides the nonce', () => {
    const result = judgeTest('t1', output({}), NONCE);
    expect(result.passed).toBe(true);
    expect(result.stdout).toBe('hello');
  });

  it('fails a clean exit that never reached the end of the test', () => {
    expect(judgeTest('t1', output({ stdout: 'bye\n' }), NONCE).passed).toBe(false);
  });

  it('fails a non-zero exit even if the nonce was printed', () => {
    expect(judgeTest('t1', output({ exitCode: 101 }), NONCE).passed).toBe(false);
  });

  it('fails a timed-out test', () => {
    expect(judgeTest('t1', output({ timedOut: true, exitCode: 137 }), NONCE).passed).toBe(false);
  });
});

describe('overallStatus', () => {
  const result = (passed: boolean, timedOut = false) => ({
    ...judgeTest('t', output({}), NONCE),
    passed,
    timedOut,
  });

  it('is passed only when every test passed', () => {
    expect(overallStatus([result(true), result(true)])).toBe('passed');
    expect(overallStatus([result(true), result(false)])).toBe('failed');
  });

  it('is timeout when a failing test ran out of time', () => {
    expect(overallStatus([result(true), result(false, true)])).toBe('timeout');
  });
});
