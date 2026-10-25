import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import { FAILURES_JQ, FOUNDRY_TOML, PASSED_JQ, REPORT_JQ, TEST_HEADER } from './solidity-prelude';
import type { Harness, LanguageSpec } from './types';

/**
 * A test file is a Solidity source without the license, pragma and imports: forge-std's Test (and
 * Vm, console, stdError, StdInvariant) and the learner's file are imported for it, on its first
 * line. Every `test...` function in it must pass.
 */
function testSource(code: string): string {
  return `${TEST_HEADER}${code}\n`;
}

/**
 * forge compiles everything once. Each test then runs alone and reports as JSON, which jq turns
 * into the learner's output and the verdict. A contract under test cannot end the process or
 * skip its test, so only a run whose every test function succeeded prints the nonce.
 */
function testScript(n: number, nonce: string): string {
  const json = `/tmp/case_${n}.json`;
  return [
    `forge test --match-path test/Case${n}.t.sol -vv --json > ${json} 2> /tmp/case_${n}.err`,
    'code=$?',
    `if ! jq -e 'type == "object"' ${json} > /dev/null 2>&1; then`,
    `  echo "FAIL: forge could not run the test" >&2; cat /tmp/case_${n}.err >&2; exit 1`,
    'fi',
    `jq -r -f .lab/report.jq ${json}`,
    `jq -r -f .lab/failures.jq ${json} >&2`,
    `if [ $code -eq 0 ] && jq -e -f .lab/passed.jq ${json} > /dev/null; then printf '\\n%s\\n' '${nonce}'; exit 0; fi`,
    'exit 1',
  ].join('\n');
}

function build(request: RunnerRequest, nonce: string): Harness {
  return {
    files: [
      { path: 'foundry.toml', content: FOUNDRY_TOML },
      { path: 'src/solution.sol', content: request.code },
      { path: '.lab/report.jq', content: REPORT_JQ },
      { path: '.lab/failures.jq', content: FAILURES_JQ },
      { path: '.lab/passed.jq', content: PASSED_JQ },
      ...request.tests.map((test, i) => ({ path: `test/Case${i + 1}.t.sol`, content: testSource(test.code) })),
      ...request.fixtures,
    ],
    compile: ['forge', 'build'],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['sh', '-c', testScript(i + 1, nonce)] })),
  };
}

export const solidity: LanguageSpec = {
  image: config.images.solidity,
  minMemoryMb: 512,
  pids: 128,
  build,
};
