// Checks the curriculum and runs every lab in the real sandbox.
//
//   npm run content:verify                 everything
//   npm run content:verify -- rust         one track
//   npm run content:verify -- rust/basic   one level
//
// Needs Docker and the sandbox images (`npm run sandbox:build`).
import { fileURLToPath } from 'node:url';
import type { RunnerRequest, RunnerResponse } from '@mettle/shared';
import { loadContent } from '../apps/api/src/content/load';
import type { ContentCourse, ContentLab, ContentTrack } from '../apps/api/src/content/types';

process.env.RUNNER_TOKEN ??= 'content-verify';
const { execute } = await import('../apps/runner/src/execute');

const contentDir = fileURLToPath(new URL('../content', import.meta.url));
const [filterTrack, filterLevel] = (process.argv[2] ?? '').split('/');
const problems: string[] = [];
const seenKeys = new Set<string>();

function expect(condition: boolean, message: string): void {
  if (!condition) problems.push(message);
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function checkStructure(where: string, course: ContentCourse): void {
  expect(course.lessons.length === 3, `${where}: expected 3 lessons, found ${course.lessons.length}`);
  expect(course.questions.length === 5, `${where}: expected 5 questions, found ${course.questions.length}`);
  expect(course.lab !== null, `${where}: no lab`);
  for (const lesson of course.lessons) {
    const count = words(lesson.body);
    expect(count >= 250 && count <= 700, `${where}/${lesson.slug}: body is ${count} words (want 250-700)`);
    expect(lesson.body.includes('## Outline'), `${where}/${lesson.slug}: no "## Outline" section`);
    expect(lesson.body.includes('## Key takeaways'), `${where}/${lesson.slug}: no "## Key takeaways" section`);
  }
  for (const question of course.questions) {
    expect(!seenKeys.has(question.key), `${where}: duplicate question key ${question.key}`);
    seenKeys.add(question.key);
  }
  if (course.lab) {
    expect(course.lab.tests.length === 3, `${where}: lab has ${course.lab.tests.length} tests (want 3)`);
    expect(course.lab.tests.some((t) => !t.hidden), `${where}: lab has no visible test`);
  }
}

function run(lab: ContentLab, code: string): Promise<RunnerResponse> {
  const request: RunnerRequest = {
    language: lab.language,
    code,
    fixtures: lab.fixtures,
    tests: lab.tests.map((test, i) => ({ id: String(i + 1), name: test.name, code: test.code })),
    timeLimitMs: lab.timeLimitMs,
    memoryMb: lab.memoryMb,
  };
  return execute(request);
}

function describeFailure(lab: ContentLab, result: RunnerResponse): string {
  if (result.status === 'compile_error') return `does not build:\n${result.compile?.stderr ?? ''}`;
  const failed = result.tests.filter((t) => !t.passed);
  return failed
    .map((t) => `test ${t.id} "${lab.tests[Number(t.id) - 1]?.name}" failed:\n${t.stderr || t.stdout}`)
    .join('\n');
}

async function checkLab(where: string, lab: ContentLab): Promise<string> {
  const solution = await run(lab, lab.solution);
  expect(solution.status === 'passed', `${where}: reference solution ${describeFailure(lab, solution)}`);
  const starter = await run(lab, lab.starter);
  expect(starter.status !== 'compile_error', `${where}: starter ${describeFailure(lab, starter)}`);
  expect(starter.status !== 'passed', `${where}: the starter already passes every test`);
  const passed = starter.tests.filter((t) => t.passed).length;
  return `solution ${solution.status} in ${solution.durationMs} ms; starter passes ${passed}/${lab.tests.length}`;
}

async function checkTrack(track: ContentTrack): Promise<void> {
  for (const course of track.courses) {
    if (filterLevel && course.level !== filterLevel) continue;
    const where = `${track.slug}/${course.level}`;
    checkStructure(where, course);
    const labNote = course.lab ? await checkLab(where, course.lab) : 'no lab';
    console.log(`  ${where.padEnd(34)} ${course.lessons.length} lessons, ${course.questions.length} questions, ${labNote}`);
  }
}

// Load only the track being verified, so a half-written neighbor cannot break the run.
const tracks = loadContent(contentDir, filterTrack ? [filterTrack] : undefined);
if (tracks.length === 0) problems.push(`No track matches "${filterTrack}"`);
console.log(`Verifying ${tracks.length} track(s)\n`);
for (const track of tracks) await checkTrack(track);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`- ${problem}\n`);
  process.exit(1);
}
console.log('\nAll content verified.');
