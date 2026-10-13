// Runs any file as the learner's code against one lab, in the real sandbox.
// Use it while writing a lab, to check that a wrong answer is caught:
//
//   npm run content:try -- rust/basic path/to/attempt.rs
//
// Needs Docker and the sandbox images (`npm run sandbox:build`).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { RunnerRequest } from '@mettle/shared';
import { loadContent } from '../apps/api/src/content/load';

process.env.RUNNER_TOKEN ??= 'content-try';
const { execute } = await import('../apps/runner/src/execute');

const [where = '', file] = process.argv.slice(2);
const [trackSlug = '', level] = where.split('/');
const contentDir = fileURLToPath(new URL('../content', import.meta.url));
const lab = loadContent(contentDir, [trackSlug])[0]?.courses.find((course) => course.level === level)?.lab;
if (!lab || !file) {
  console.error('Usage: npm run content:try -- <track>/<level> <file>');
  process.exit(2);
}

const request: RunnerRequest = {
  language: lab.language,
  code: readFileSync(file, 'utf8'),
  fixtures: lab.fixtures,
  tests: lab.tests.map((test, i) => ({ id: String(i + 1), name: test.name, code: test.code })),
  timeLimitMs: lab.timeLimitMs,
  memoryMb: lab.memoryMb,
};
const result = await execute(request);

console.log(`${lab.title}: ${result.status} in ${result.durationMs} ms`);
if (result.status === 'compile_error') console.log(result.compile?.stderr || result.compile?.stdout);
for (const test of result.tests) {
  console.log(`  ${test.passed ? 'pass' : 'FAIL'}  ${lab.tests[Number(test.id) - 1]?.name}${test.timedOut ? ' (timed out)' : ''}`);
  const output = (test.stderr || test.stdout).trim();
  if (!test.passed && output) console.log(output.split('\n').map((line) => `        ${line}`).join('\n'));
}
process.exit(result.status === 'passed' ? 0 : 1);
