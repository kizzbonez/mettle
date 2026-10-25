/**
 * Solidity: the harness prints "FAIL: reason" for each failed test function, where the reason is
 * forge's: the learner's revert message or custom error, a panic, or a forge-std assertion.
 * An assertion's reason ends with both values ("the balance: 0 != 5"), which a hidden test must
 * not show, so that part is cut and the author's message is kept.
 */

const nonEmptyLines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);

/** The operator in the values part of a forge-std assertion: "0 != 5", "3 <= 4", "1 !~= 2 (...)". */
const COMPARED = / (?:!=|==|<=|>=|<|>|!~=) /;

/**
 * The message the test's author gave an assertion, without the values it compared: everything
 * before the last ": " that still has a comparison after it. Values may hold colons (a URL) and
 * so may messages ("line 3: the total"), but a value rarely holds ": ".
 */
export function withoutValues(reason: string): string {
  if (/^assertion failed(?::|$)/.test(reason)) return 'An assertion failed (the test gave it no message).';
  let cut = -1;
  for (let at = reason.indexOf(': '); at >= 0; at = reason.indexOf(': ', at + 2)) {
    if (COMPARED.test(reason.slice(at + 2))) cut = at;
  }
  return cut >= 0 ? reason.slice(0, cut) : reason;
}

/**
 * forge's own reasons for vm.expectRevert and vm.expectEmit, in plain words. Each also names
 * what the test expected, which a hidden test must not show; the learner's own revert is kept,
 * and a starter's "not implemented" stays recognisable as one.
 */
function plainReason(reason: string): string {
  const wrongError = /^Error != expected error: (.*?) != /.exec(reason);
  if (wrongError) {
    const actual = wrongError[1] ?? '';
    return /^not implemented(?::|$)/.test(actual) ? actual : `It reverted with ${actual}, not with the error the test expected.`;
  }
  if (/call did not revert as expected$/.test(reason)) return 'A call that should have reverted did not revert.';
  if (reason === 'log != expected log' || reason.startsWith('expected an emit')) {
    return 'An event the test expected was not emitted, or not with the values it expected.';
  }
  const param = /^(\w+) param mismatch at (\w+)/.exec(reason);
  if (param) return `The ${param[1]} event was emitted with the wrong ${param[2]}.`;
  return withoutValues(reason);
}

export function solidityMessage(stderr: string): string | null {
  const lines = nonEmptyLines(stderr);
  const failed = lines.find((line) => line.startsWith('FAIL:'));
  if (failed) return plainReason(failed.replace(/^FAIL:\s*/, ''));
  return lines.at(-1) ?? null;
}
