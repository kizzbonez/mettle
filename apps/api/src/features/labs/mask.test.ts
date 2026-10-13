import { describe, expect, it } from 'vitest';
import { failureMessage, presentResult, type StoredResult } from './mask';

function result(overrides: Partial<StoredResult>): StoredResult {
  return {
    name: 'a test',
    hidden: true,
    passed: false,
    timedOut: false,
    exitCode: 1,
    durationMs: 40,
    stdout: 'debug output',
    stderr: '',
    ...overrides,
  };
}

describe('failureMessage', () => {
  it('is null for a passing test', () => {
    expect(failureMessage('rust', result({ passed: true, exitCode: 0 }), 5000)).toBeNull();
  });

  it('takes the assertion message from a Rust panic, without the compared values', () => {
    const stderr = [
      '',
      "thread 'main' (59) panicked at main.rs:11:1:",
      'assertion `left == right` failed: an empty ledger has no balance',
      '  left: 4',
      ' right: 5',
      'note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace',
    ].join('\n');
    const message = failureMessage('rust', result({ stderr, exitCode: 101 }), 5000);
    expect(message).toBe('assertion `left == right` failed: an empty ledger has no balance');
    expect(message).not.toContain('left: 4');
  });

  it('takes the last traceback line from Python, not the test source', () => {
    const stderr = [
      'Traceback (most recent call last):',
      '  File "/work/case_2.py", line 5, in <module>',
      '    assert top_k(query, docs, 2) == ["b", "a"], "results must be ordered by similarity"',
      'AssertionError: results must be ordered by similarity',
    ].join('\n');
    const message = failureMessage('python', result({ stderr }), 5000);
    expect(message).toBe('AssertionError: results must be ordered by similarity');
    expect(message).not.toContain('["b", "a"]');
  });

  it('takes the FAIL line from Bash, without expected and actual', () => {
    const stderr = 'FAIL: equal counts ordered by address\n  expected: 10.0.0.1 3\n  actual:   \n';
    expect(failureMessage('bash', result({ stderr }), 5000)).toBe('equal counts ordered by address');
  });

  it('reports a timeout with the limit', () => {
    expect(failureMessage('python', result({ timedOut: true, exitCode: 137 }), 2500)).toBe('Timed out after 2.5 s.');
  });

  it('explains a kill that was not a timeout', () => {
    expect(failureMessage('python', result({ exitCode: 137 }), 5000)).toMatch(/too much memory/);
  });

  it('explains a clean exit that skipped the assertions', () => {
    expect(failureMessage('rust', result({ exitCode: 0 }), 5000)).toMatch(/exited before the test finished/);
  });

  it('takes the check message from a C++ or C# failure, without the compared values', () => {
    const stderr = ['FAIL: the queue keeps arrival order', '  expected: [1, 2, 3]', '  actual:   [1, 3, 2]'].join('\n');
    expect(failureMessage('cpp', result({ stderr }), 5000)).toBe('the queue keeps arrival order');
    expect(failureMessage('csharp', result({ stderr }), 5000)).toBe('the queue keeps arrival order');
  });

  it('names what a C++ sanitizer caught', () => {
    const useAfterFree = ['==39==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 at pc 0x5b2b', 'READ of size 4'].join('\n');
    expect(failureMessage('cpp', result({ stderr: useAfterFree }), 5000)).toBe('Memory error: heap-use-after-free.');
    const leak = ['', '==47==ERROR: LeakSanitizer: detected memory leaks', '', 'Direct leak of 32 byte(s) in 1 object(s)'].join('\n');
    expect(failureMessage('cpp', result({ stderr: leak }), 5000)).toMatch(/^Memory leak/);
    const overflow = "solution.cpp:16:34: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'";
    expect(failureMessage('cpp', result({ stderr: overflow }), 5000)).toMatch(/^Undefined behaviour: signed integer overflow/);
  });

  it('explains a crash that printed nothing', () => {
    expect(failureMessage('cpp', result({ exitCode: 139 }), 5000)).toMatch(/segmentation fault/);
  });

  it('caps very long messages', () => {
    const stderr = `AssertionError: ${'x'.repeat(2000)}`;
    expect(failureMessage('python', result({ stderr }), 5000)?.length).toBe(240);
  });
});

describe('presentResult', () => {
  it('withholds the output of a hidden test', () => {
    const shown = presentResult('bash', result({ hidden: true, stderr: 'FAIL: nope\n  expected: secret' }), 5000);
    expect(shown.stdout).toBeNull();
    expect(shown.stderr).toBeNull();
    expect(shown.message).toBe('nope');
  });

  it('shows the full output of a visible test', () => {
    const shown = presentResult('bash', result({ hidden: false, stderr: 'FAIL: nope\n  expected: 2' }), 5000);
    expect(shown.stdout).toBe('debug output');
    expect(shown.stderr).toContain('expected: 2');
  });
});
