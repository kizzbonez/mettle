import type { LabLanguage } from '@mettle/shared';
import { explainPlaceholder } from './placeholder';

/**
 * What a learner may see of one test result. A visible test shows everything.
 * A hidden test shows whether it passed, how long it took and a one-line
 * reason, and never the test's own source, its output, or the expected values.
 */

export interface StoredResult {
  name: string;
  hidden: boolean;
  passed: boolean;
  timedOut: boolean;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface PresentedResult {
  name: string;
  hidden: boolean;
  passed: boolean;
  timedOut: boolean;
  durationMs: number;
  /** One-line reason for a failure; null when the test passed. */
  message: string | null;
  stdout: string | null;
  stderr: string | null;
}

const MAX_MESSAGE = 240;
const KILLED = 137;
/** Rust ends every panic with advice about an environment variable, which nobody can set in the sandbox. */
const BACKTRACE_NOTE = /^note: run with `RUST_BACKTRACE=1`.*\n?/m;

const nonEmptyLines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);

/** Rust: the line after "panicked at ..." is the assertion message. */
function rustMessage(stderr: string): string | null {
  const lines = stderr.split('\n');
  const at = lines.findIndex((line) => line.includes('panicked at'));
  const message = at >= 0 ? lines[at + 1]?.trim() : undefined;
  return message || null;
}

/** Python: the last line of a traceback is "ErrorType: message". */
function pythonMessage(stderr: string): string | null {
  return nonEmptyLines(stderr).at(-1) ?? null;
}

/** Bash: the harness helpers print "FAIL: message" first. */
function bashMessage(stderr: string): string | null {
  const lines = nonEmptyLines(stderr);
  return lines.find((line) => line.startsWith('FAIL:'))?.replace(/^FAIL:\s*/, '') ?? lines.at(-1) ?? null;
}

/**
 * C++: a failed check prints "FAIL: message". Otherwise a sanitizer stopped
 * the program, and its headline says what the learner's own code did wrong.
 */
function cppMessage(stderr: string): string | null {
  const lines = nonEmptyLines(stderr);
  const failed = lines.find((line) => line.startsWith('FAIL:'));
  if (failed) return failed.replace(/^FAIL:\s*/, '');
  if (lines.some((line) => line.includes('LeakSanitizer: detected memory leaks'))) return 'Memory leak: something that was allocated was never freed.';
  const memory = lines.find((line) => line.includes('ERROR: AddressSanitizer:'))?.match(/AddressSanitizer: ([a-z-]+)/)?.[1];
  if (memory) return `Memory error: ${memory}.`;
  const undefinedBehaviour = lines.find((line) => line.includes('runtime error:'))?.split('runtime error:')[1]?.trim();
  if (undefinedBehaviour) return `Undefined behaviour: ${undefinedBehaviour}.`;
  return lines.at(-1) ?? null;
}

const extractors: Record<LabLanguage, (stderr: string) => string | null> = {
  rust: rustMessage,
  python: pythonMessage,
  bash: bashMessage,
  cpp: cppMessage,
  // C#: the harness prints "FAIL: message", as the bash helpers do.
  csharp: bashMessage,
  // YAML labs are checked by Python scripts.
  yaml: pythonMessage,
};

/** Exit codes that mean the program crashed: 128 plus the signal that ended it. */
const CRASHES: Record<number, string> = {
  134: 'The program aborted.',
  136: 'The program crashed with an arithmetic error, such as dividing by zero.',
  139: 'The program crashed with a segmentation fault: it read or wrote memory it does not own.',
};

export function failureMessage(language: LabLanguage, result: StoredResult, timeLimitMs: number): string | null {
  if (result.passed) return null;
  if (result.timedOut) return `Timed out after ${(timeLimitMs / 1000).toFixed(1)} s.`;
  if (result.exitCode === KILLED) return 'The process was killed, most likely for using too much memory.';
  const crash = CRASHES[result.exitCode ?? 0];
  if (crash && !result.stderr.trim()) return crash;
  const extracted = extractors[language](result.stderr);
  if (extracted) return explainPlaceholder(extracted).slice(0, MAX_MESSAGE);
  if (result.exitCode === 0) return 'The code exited before the test finished checking it.';
  return `The test failed (exit code ${result.exitCode ?? 'unknown'}).`;
}

export function presentResult(language: LabLanguage, result: StoredResult, timeLimitMs: number): PresentedResult {
  return {
    name: result.name,
    hidden: result.hidden,
    passed: result.passed,
    timedOut: result.timedOut,
    durationMs: result.durationMs,
    message: failureMessage(language, result, timeLimitMs),
    stdout: result.hidden ? null : result.stdout,
    stderr: result.hidden ? null : result.stderr.replace(BACKTRACE_NOTE, ''),
  };
}
