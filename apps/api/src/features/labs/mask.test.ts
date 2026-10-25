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

  it('says in plain words that starter code is still a placeholder', () => {
    const todo = ["thread 'main' (53) panicked at solution.rs:51:5:", 'not yet implemented: parse_ledger', 'note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace'].join('\n');
    expect(failureMessage('rust', result({ exitCode: 101, stderr: todo }), 5000)).toBe(
      "`parse_ledger` is not written yet: it still has the starter's todo!() placeholder. Replace it with your code.",
    );
    const python = 'Traceback (most recent call last):\n  File "case_1.py", line 3\nNotImplementedError: softmax is not implemented yet';
    expect(failureMessage('python', result({ stderr: python }), 5000)).toBe(
      'softmax is not implemented yet: replace the starter\'s "raise NotImplementedError" with your code.',
    );
    const csharp = 'FAIL: unexpected NotImplementedException: The method or operation is not implemented.';
    expect(failureMessage('csharp', result({ stderr: csharp }), 5000)).toMatch(/^This part is not written yet/);
    const typescript = 'FAIL: unexpected Error: Not implemented: area\nError: Not implemented: area\n    at area (/work/solution.ts:3:9)';
    expect(failureMessage('typescript', result({ stderr: typescript }), 5000)).toBe(
      '`area` is not written yet: replace the starter\'s throw new Error("Not implemented") with your code.',
    );
  });

  it('turns TypeScript compiler errors in a test into plain reasons', () => {
    const loose = "case_2.ts(6,1): error TS2578: Unused '@ts-expect-error' directive.";
    expect(failureMessage('typescript', result({ stderr: loose }), 5000)).toBe(
      'A type check failed: your types accept code that the test expected them to reject.',
    );
    const mismatch = "case_1.ts(3,13): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.";
    expect(failureMessage('typescript', result({ stderr: mismatch }), 5000)).toBe(
      "Type error: Argument of type 'string' is not assignable to parameter of type 'number'.",
    );
    const check = 'FAIL: the area of a 3 by 3 square\n  expected: 9\n  actual:   6';
    expect(failureMessage('typescript', result({ stderr: check }), 5000)).toBe('the area of a 3 by 3 square');
  });

  it('reads the reasons a Go test fails for', () => {
    const go = (overrides: Partial<StoredResult>) => failureMessage('go', result(overrides), 5000);
    expect(go({ stderr: 'FAIL: the area of a 3 by 3 square\n  expected: 10\n  actual:   9' })).toBe('the area of a 3 by 3 square');
    expect(go({ stderr: 'FAIL: unexpected panic in Cart.Add: not implemented\ngoroutine 20 [running]:' })).toBe(
      '`Cart.Add` is not written yet: replace the starter\'s panic("not implemented") with your code.',
    );
    const race = [
      '==================',
      'WARNING: DATA RACE',
      'Read at 0x00c000094328 by goroutine 12:',
      '  lab.count.func1()',
      '      /work/solution.go:9 +0x2e',
    ].join('\n');
    expect(go({ stderr: race, stdout: '--- FAIL: TestCase1 (0.00s)\n    testing.go:1867: race detected during execution of test' })).toBe(
      'Data race at solution.go line 9: two goroutines used the same memory at once, at least one of them writing.',
    );
    expect(go({ stderr: 'panic: test timed out after 4.25s\n\trunning tests:\n\t\tTestCase7 (4s)', exitCode: 2 })).toMatch(/^Timed out after 4.25s: /);
    expect(go({ stderr: 'panic: send on closed channel\n\ngoroutine 9 [running]:', exitCode: 2 })).toBe('A goroutine panicked: send on closed channel');
    const bubble = [
      'panic: not implemented [recovered, repanicked]',
      '',
      'goroutine 22 [running, synctest bubble 1]:',
      'panic({0x7ced80?, 0x644f30?})',
      '\t/usr/local/go/src/runtime/panic.go:859 +0x125',
      'lab.(*desk).serve(...)',
      '\t/work/solution.go:5',
      'lab.TestCase1.func1(0xc0000ea488?)',
      '\t/work/case_1_test.go:6 +0x2c',
    ].join('\n');
    expect(go({ stderr: bubble, exitCode: 2 })).toBe('`desk.serve` is not written yet: replace the starter\'s panic("not implemented") with your code.');
    const spawned = 'panic: boom\n\ngoroutine 23 [running]:\nlab.later.func2(...)\n\t/work/solution.go:7\ncreated by lab.TestCase2 in goroutine 22';
    expect(go({ stderr: spawned, exitCode: 2 })).toBe('A goroutine panicked in later: boom');
    expect(go({ stdout: '--- FAIL: TestCase6 (0.00s)\n    case_6_test.go:5: the total of three prices\nFAIL' })).toBe('the total of three prices');
  });

  it('reads a Solidity failure without the values an assertion compared', () => {
    const sol = (stderr: string) => failureMessage('solidity', result({ stderr }), 5000);
    expect(sol("FAIL: other depositors' ether stays in the vault: 0 != 5000000000000000000\n  in test_vault()")).toBe(
      "other depositors' ether stays in the vault",
    );
    expect(sol('FAIL: line 3: the total: 5 != 6\n  in test_total()')).toBe('line 3: the total');
    expect(sol('FAIL: the tokenURI of tree 2: https://orchard.example/trees2 != https://orchard.example/trees/2')).toBe('the tokenURI of tree 2');
    expect(sol('FAIL: the fee stays under the cap: 30 > 25\n  in test_cap()')).toBe('the fee stays under the cap');
    expect(sol('FAIL: assertion failed: 1 != 2\n  in test_x()')).toBe('An assertion failed (the test gave it no message).');
    expect(sol('FAIL: panic: arithmetic underflow or overflow (0x11)\n  in testFuzz_half(uint8)')).toBe('panic: arithmetic underflow or overflow (0x11)');
    expect(sol('FAIL: NotOwner()\n  in test_owner()')).toBe('NotOwner()');
    expect(sol('FAIL: not implemented: fee\n  in test_fee()')).toBe('`fee` is not written yet: replace the starter\'s revert("not implemented") with your code.');
  });

  it('puts forge\'s expectRevert and expectEmit reasons in plain words, without what was expected', () => {
    const sol = (stderr: string) => failureMessage('solidity', result({ stderr }), 5000);
    expect(sol('FAIL: Error != expected error: ZeroAddress() != NotKeeper(0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496)')).toBe(
      'It reverted with ZeroAddress(), not with the error the test expected.',
    );
    expect(sol('FAIL: Error != expected error: not implemented: write != NotKeeper(0xD720eb464FedBBEaa50D53C47EAe3AeC9BB18301)')).toBe(
      '`write` is not written yet: replace the starter\'s revert("not implemented") with your code.',
    );
    expect(sol('FAIL: next call did not revert as expected')).toBe('A call that should have reverted did not revert.');
    expect(sol('FAIL: log != expected log')).toBe('An event the test expected was not emitted, or not with the values it expected.');
    expect(sol('FAIL: KeeperChanged param mismatch at previous: expected=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, got=0x0000000000000000000000000000000000000B0b')).toBe(
      'The KeeperChanged event was emitted with the wrong previous.',
    );
  });

  it('leaves an ordinary failure message as the author wrote it', () => {
    const stderr = ["thread 'main' (59) panicked at main.rs:11:1:", 'a blank line is skipped, not counted as an error'].join('\n');
    expect(failureMessage('rust', result({ stderr }), 5000)).toBe('a blank line is skipped, not counted as an error');
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

  it('drops the backtrace advice from a Rust panic, which cannot be followed in the sandbox', () => {
    const stderr = "thread 'main' (53) panicked at solution.rs:51:5:\nnot yet implemented: parse_ledger\nnote: run with `RUST_BACKTRACE=1` environment variable to display a backtrace\n";
    const shown = presentResult('rust', result({ hidden: false, stderr }), 5000);
    expect(shown.stderr).toBe("thread 'main' (53) panicked at solution.rs:51:5:\nnot yet implemented: parse_ledger\n");
  });

  it('shows the full output of a visible test', () => {
    const shown = presentResult('bash', result({ hidden: false, stderr: 'FAIL: nope\n  expected: 2' }), 5000);
    expect(shown.stdout).toBe('debug output');
    expect(shown.stderr).toContain('expected: 2');
  });
});
