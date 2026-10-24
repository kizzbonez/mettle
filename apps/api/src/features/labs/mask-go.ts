/**
 * Go: a failed check, or a panic inside a test, prints "FAIL: message". The race detector, a
 * deadlock, testing's own deadline and a panic in another goroutine (a synctest bubble's, or one
 * the code started) have reports of their own, and t.Errorf goes to standard output as
 * `case_N_test.go:LINE: message`.
 */

const nonEmptyLines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);

/** "lab.(*Cart).Add.func1(...)" becomes "Cart.Add", as the harness's own check.Recover names it. */
function shortName(frame: string): string {
  const name = frame.replace(/\([^()]*\)$/, '').split('/').at(-1) ?? '';
  return name
    .slice(name.indexOf('.') + 1)
    .replace(/\(\*|\)/g, '')
    .replace(/(\.(func|gowrap)?\d+)+$/, '');
}

/** The innermost function of solution.go on a goroutine's stack: the line above its file:line. */
function solutionFunction(lines: string[]): string | null {
  const at = lines.findIndex((line) => line.startsWith('/work/solution.go:'));
  return at > 0 ? shortName(lines[at - 1] ?? '') : null;
}

/** A goroutine's panic: an unwritten starter function reads as check.Recover would report it. */
function panicMessage(line: string, lines: string[]): string {
  const value = line.replace(/^panic:\s*/, '').replace(/\s*\[recovered.*\]$/, '');
  const where = solutionFunction(lines);
  if (value === 'not implemented') return `unexpected panic${where ? ` in ${where}` : ''}: not implemented`;
  return `A goroutine panicked${where ? ` in ${where}` : ''}: ${value}`;
}

export function goMessage(stderr: string, stdout: string): string | null {
  const lines = nonEmptyLines(stderr);
  const failed = lines.find((line) => line.startsWith('FAIL:'));
  if (failed) return failed.replace(/^FAIL:\s*/, '');
  if (stderr.includes('WARNING: DATA RACE')) {
    const line = /\/solution\.go:(\d+)/.exec(stderr)?.[1];
    return `Data race${line ? ` at solution.go line ${line}` : ''}: two goroutines used the same memory at once, at least one of them writing.`;
  }
  if (stderr.includes('all goroutines are asleep - deadlock!')) return 'Deadlock: every goroutine is blocked, waiting for something no other goroutine will do.';
  const deadline = /^panic: test timed out after (\S+)/m.exec(stderr)?.[1];
  if (deadline) return `Timed out after ${deadline}: the code is still running, or is blocked on a channel or a lock.`;
  const panicked = lines.find((line) => line.startsWith('panic: '));
  if (panicked) return panicMessage(panicked, lines);
  const reported = nonEmptyLines(stdout).find((line) => /^\S+_test\.go:\d+: /.test(line));
  if (reported) return reported.replace(/^\S+_test\.go:\d+:\s*/, '');
  return lines.at(-1) ?? null;
}
