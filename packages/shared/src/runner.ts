import type { LabLanguage } from './domain';

/** Contract between the API and the sandbox runner (POST /execute). */

/** Most fixture files one lab may ship; their total size is capped separately by the runner. */
export const MAX_LAB_FIXTURES = 64;

export interface RunnerFile {
  path: string;
  content: string;
}

export interface RunnerTest {
  id: string;
  name: string;
  /** Language-specific test body; see docs/ARCHITECTURE.md, "Test harness". */
  code: string;
}

export interface RunnerRequest {
  language: LabLanguage;
  code: string;
  fixtures: RunnerFile[];
  tests: RunnerTest[];
  /** Wall-clock limit for each test, in milliseconds. */
  timeLimitMs: number;
  memoryMb: number;
}

export interface RunnerStepOutput {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
}

export interface RunnerTestResult extends RunnerStepOutput {
  id: string;
  passed: boolean;
}

export type RunnerStatus = 'passed' | 'failed' | 'compile_error' | 'timeout' | 'error';

export interface RunnerResponse {
  status: RunnerStatus;
  /** Output of the build or syntax-check step. */
  compile: RunnerStepOutput | null;
  tests: RunnerTestResult[];
  durationMs: number;
  /** Set when the sandbox itself failed, as opposed to the learner's code. */
  error?: string;
}
