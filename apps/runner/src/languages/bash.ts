import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import type { Harness, LanguageSpec } from './types';

/** Helpers every bash test body can call. */
const PRELUDE = [
  'set -u',
  `fail() { printf 'FAIL: %s\\n' "$*" >&2; exit 1; }`,
  '# assert_eq ACTUAL EXPECTED [MESSAGE]',
  'assert_eq() {',
  '  if [ "$1" != "$2" ]; then',
  `    printf 'FAIL: %s\\n  expected: %s\\n  actual:   %s\\n' "\${3:-unexpected output}" "$2" "$1" >&2`,
  '    exit 1',
  '  fi',
  '}',
].join('\n');

function caseSource(body: string, nonce: string): string {
  return [PRELUDE, '', body, '', `printf '\\n%s\\n' '${nonce}'`, ''].join('\n');
}

/**
 * The learner's file is `solution.sh`; each test body is a script that runs it
 * (usually against a fixture) and asserts on what it printed.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  const cases = request.tests.map((test, i) => ({
    path: `case_${i + 1}.sh`,
    content: caseSource(test.code, nonce),
  }));
  return {
    files: [{ path: 'solution.sh', content: request.code }, ...cases, ...request.fixtures],
    compile: ['bash', '-n', 'solution.sh'],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['bash', `case_${i + 1}.sh`] })),
  };
}

export const bash: LanguageSpec = {
  image: config.images.bash,
  minMemoryMb: 128,
  pids: 64,
  build,
};
