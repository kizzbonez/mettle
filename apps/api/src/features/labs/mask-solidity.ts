/**
 * Solidity: the harness prints "FAIL: reason" for each failed test function, where the reason is
 * forge's: the learner's revert message or custom error, a panic, or a forge-std assertion.
 * An assertion's reason ends with both values ("the balance: 0 != 5"), which a hidden test must
 * not show, so that part is cut and the author's message is kept.
 */

const nonEmptyLines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);

/** The values part of a forge-std assertion: "0 != 5", "3 <= 4", "1 !~= 2 (max delta: ...)". */
const COMPARED = /^[^:]*? (?:!=|==|<=|>=|<|>|!~=) /;

/** The message the test's author gave an assertion, without the values it compared. */
export function withoutValues(reason: string): string {
  if (/^assertion failed(?::|$)/.test(reason)) return 'An assertion failed (the test gave it no message).';
  for (let at = reason.indexOf(': '); at >= 0; at = reason.indexOf(': ', at + 2)) {
    if (COMPARED.test(reason.slice(at + 2))) return reason.slice(0, at);
  }
  return reason;
}

export function solidityMessage(stderr: string): string | null {
  const lines = nonEmptyLines(stderr);
  const failed = lines.find((line) => line.startsWith('FAIL:'));
  if (failed) return withoutValues(failed.replace(/^FAIL:\s*/, ''));
  return lines.at(-1) ?? null;
}
