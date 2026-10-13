import type { RunnerFile, RunnerRequest } from '@mettle/shared';

export interface HarnessTest {
  id: string;
  cmd: string[];
}

/** Everything the executor needs to run one submission in one language. */
export interface Harness {
  files: RunnerFile[];
  /** Build or syntax-check command; a non-zero exit stops the run. */
  compile: string[] | null;
  tests: HarnessTest[];
}

export interface LanguageSpec {
  image: string;
  /** Floor for the memory limit; compilers need more than most labs ask for. */
  minMemoryMb: number;
  pids: number;
  /**
   * `nonce` is a per-run secret the harness prints after a test body returns.
   * A test passes only if it exits 0 and that line is present.
   */
  build(request: RunnerRequest, nonce: string): Harness;
}
