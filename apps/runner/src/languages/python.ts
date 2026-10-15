import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import { PYTHON_HELPERS } from './python-prelude';
import type { Harness, LanguageSpec } from './types';

/** Everything the learner's file defines is in scope, as after `from solution import *`. */
function caseSource(body: string, nonce: string): string {
  return [
    'from lab_helpers import Ran, check_array, check_frame, load_solution, printed_by, run_script  # noqa: F401',
    'globals().update(load_solution())',
    '',
    body,
    '',
    `print("\\n${nonce}")`,
    '',
  ].join('\n');
}

/**
 * The learner's file is the module `solution`; each test body is a script that
 * loads it and runs as `python case_N.py`.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  const cases = request.tests.map((test, i) => ({
    path: `case_${i + 1}.py`,
    content: caseSource(test.code, nonce),
  }));
  return {
    files: [{ path: 'solution.py', content: request.code }, { path: 'lab_helpers.py', content: PYTHON_HELPERS }, ...cases, ...request.fixtures],
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
