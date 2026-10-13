import type { LabLanguage } from '@mettle/shared';

/**
 * What a learner may see of the compiler's output. In a compiled language the
 * tests are built into the same program, so when the learner's code does not
 * fit them (a missing function, a wrong parameter type) the compiler quotes
 * the offending line of the *test*. Those excerpts are removed: the message
 * still says what is wrong, and a hidden test stays hidden. Everything about
 * the learner's own file is left as it was.
 */

/** A quoted source line or the marker line under it: `12 |   code` or `   |   ^^^`. */
const EXCERPT = /^\s*\d*\s*\|/;
const IN_A_TEST = 'in a test';

/** rustc: `--> file:line:col` opens an excerpt; `= note:` and `= help:` lines belong to it. */
function redactRust(lines: string[]): string[] {
  const kept: string[] = [];
  let inHarness = false;
  for (const line of lines) {
    const location = line.match(/^(\s*(?:-->|:::)\s+)(\S+?):\d+/);
    if (location) {
      inHarness = location[2] === 'main.rs';
      kept.push(inHarness ? `${location[1]}${IN_A_TEST}` : line);
    } else if (line.trim() === '') {
      inHarness = false;
      kept.push(line);
    } else if (!inHarness || !(EXCERPT.test(line) || /^\s+= /.test(line))) {
      kept.push(line);
    }
  }
  return kept;
}

/** g++: every diagnostic line starts with its file; the excerpt follows it. */
function redactGcc(lines: string[]): string[] {
  const kept: string[] = [];
  let inHarness = false;
  for (const line of lines) {
    if (EXCERPT.test(line)) {
      if (!inHarness) kept.push(line);
      continue;
    }
    inHarness = line.startsWith('main.cpp:');
    if (!inHarness) {
      if (!line.startsWith('In file included from main.cpp')) kept.push(line);
    } else if (/^main\.cpp:\d+:\d+: (?:fatal error|error|warning):/.test(line)) {
      kept.push(line.replace(/^main\.cpp:\d+:\d+:/, `${IN_A_TEST}:`));
    }
  }
  return kept;
}

const redactors: Partial<Record<LabLanguage, (lines: string[]) => string[]>> = { rust: redactRust, cpp: redactGcc };

export function presentCompileOutput(language: LabLanguage, output: string): string {
  const redact = redactors[language];
  return redact ? redact(output.split('\n')).join('\n') : output;
}
