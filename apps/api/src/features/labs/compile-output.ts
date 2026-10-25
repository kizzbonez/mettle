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

/**
 * rustc and solc: `--> file:line:col` opens an excerpt; `= note:` and `= help:` lines belong to
 * it. Excerpts of the files the harness generated are dropped.
 */
function redactExcerpts(lines: string[], isHarness: (file: string) => boolean): string[] {
  const kept: string[] = [];
  let inHarness = false;
  for (const line of lines) {
    const location = line.match(/^(\s*(?:-->|:::)\s+)(\S+?):\d+/);
    if (location) {
      inHarness = isHarness(location[2] ?? '');
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

const GO_TEST_FILE = /^(\s*)(?:\.\/)?(?:case_\d+_test|lab_main_test)\.go:\d+(?::\d+)?:/;
const GO_HELPERS = /^(\s*)(?:\.\/)?check\/\w+\.go:\d+(?::\d+)?:/;
const GO_HARNESS_NAME = /\b(?:check|TestMain|TestCase\d+) (?:redeclared|already declared)/;

/**
 * go: the compiler and vet quote no source, so only the tests' positions are replaced. A
 * learner's declaration that takes a name the tests use gets a note saying so.
 */
function redactGo(lines: string[]): string[] {
  const kept = lines.map((line) => line.replace(GO_TEST_FILE, `$1${IN_A_TEST}:`).replace(GO_HELPERS, '$1in the test helpers:'));
  if (lines.some((line) => GO_HARNESS_NAME.test(line))) {
    kept.push('', 'Note: the tests use the names check, TestMain and TestCase1, TestCase2 and so on. Give your own declaration another name.');
  }
  return kept;
}

const redactRust = (lines: string[]) => redactExcerpts(lines, (file) => file === 'main.rs');

/** forge prints solc's diagnostics; the tests live in test/. Its own notes about them are dropped too. */
function redactSolidity(lines: string[]): string[] {
  const kept = lines.filter((line) => !line.startsWith('Warning: dynamic test linking'));
  return redactExcerpts(kept, (file) => file.startsWith('test/'));
}

const redactors: Partial<Record<LabLanguage, (lines: string[]) => string[]>> = {
  rust: redactRust,
  cpp: redactGcc,
  go: redactGo,
  solidity: redactSolidity,
};

export function presentCompileOutput(language: LabLanguage, output: string): string {
  const redact = redactors[language];
  return redact ? redact(output.split('\n')).join('\n') : output;
}
