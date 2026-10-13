import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import type { Harness, LanguageSpec } from './types';

function caseSource(body: string, nonce: string): string {
  return ['from solution import *  # noqa: F401,F403', '', body, '', `print("\\n${nonce}")`, ''].join('\n');
}

/**
 * The learner's file is the module `solution`; each test body is a script that
 * star-imports it and runs as `python case_N.py`.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  const cases = request.tests.map((test, i) => ({
    path: `case_${i + 1}.py`,
    content: caseSource(test.code, nonce),
  }));
  return {
    files: [{ path: 'solution.py', content: request.code }, ...cases, ...request.fixtures],
    compile: ['python', '-m', 'py_compile', 'solution.py'],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['python', `case_${i + 1}.py`] })),
  };
}

export const python: LanguageSpec = {
  image: config.images.python,
  minMemoryMb: 256,
  pids: 64,
  build,
};
