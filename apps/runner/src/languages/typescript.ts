import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import { labRunner, TS_CONFIG_BASE, TS_HELPERS } from './typescript-prelude';
import type { Harness, LanguageSpec } from './types';

const HELPER_IMPORT = 'import { check, fail, printedBy, printedByAsync, runScript, type Ran } from "./lab_helpers.js";';

function caseConfig(n: number): string {
  return JSON.stringify({ extends: './tsconfig.base.json', files: [`case_${n}.ts`] });
}

/**
 * The learner's file is type-checked first, strictly; an error there stops the run with the
 * compiler's message. Each test is then type-checked on its own, so a test whose types the
 * learner's code breaks (or a `@ts-expect-error` line the learner's types no longer reject)
 * fails alone. The test sources are deleted before any test runs, as the C# harness does.
 */
function compileScript(count: number): string {
  const cases = Array.from({ length: count }, (_, i) => `tsc -p tsconfig.case_${i + 1}.json > out/case_${i + 1}.check 2>&1`);
  return ['tsc -p tsconfig.json || exit $?', ...cases, 'rm -f case_*.ts tsconfig.case_*.json', 'exit 0'].join('\n');
}

function testCommand(n: number): string[] {
  const check = `out/case_${n}.check`;
  return ['sh', '-c', `if [ -s ${check} ]; then cat ${check} >&2; exit 1; fi; exec node --enable-source-maps lab_run.mjs out/case_${n}.js`];
}

/**
 * Each test file is a module: it imports what it needs from "./solution.js" (the learner's
 * exports), and the helpers are imported for it. It passes if it runs to its end.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  const cases = request.tests.flatMap((test, i) => [
    { path: `case_${i + 1}.ts`, content: `${HELPER_IMPORT}\n${test.code}\n` },
    { path: `tsconfig.case_${i + 1}.json`, content: caseConfig(i + 1) },
  ]);
  return {
    files: [
      { path: 'solution.ts', content: request.code },
      { path: 'lab_helpers.ts', content: TS_HELPERS },
      { path: 'lab_run.mjs', content: labRunner(nonce) },
      { path: 'package.json', content: '{ "type": "module" }\n' },
      { path: 'tsconfig.base.json', content: TS_CONFIG_BASE },
      { path: 'tsconfig.json', content: JSON.stringify({ extends: './tsconfig.base.json', files: ['solution.ts', 'lab_helpers.ts'] }) },
      ...cases,
      ...request.fixtures,
    ],
    compile: ['sh', '-c', compileScript(request.tests.length)],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: testCommand(i + 1) })),
  };
}

export const typescript: LanguageSpec = {
  image: config.images.typescript,
  minMemoryMb: 256,
  pids: 64,
  build,
};
