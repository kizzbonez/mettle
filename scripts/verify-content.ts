// Checks the curriculum and runs every lab in the real sandbox.
//
//   npm run content:verify                 everything
//   npm run content:verify -- rust         one track
//   npm run content:verify -- rust/basic   one level
//   npm run content:verify -- rust/basic/control-flow   one lesson's practice lab
//
// Needs Docker and the sandbox images (`npm run sandbox:build`).
import { fileURLToPath } from 'node:url';
import type { RunnerRequest, RunnerResponse } from '@mettle/shared';
import { loadContent } from '../apps/api/src/content/load';
import type { ContentCourse, ContentLab, ContentTrack } from '../apps/api/src/content/types';
import { ignoredContent } from './ignored-content';
import { trackProblems } from './track-checks';

process.env.RUNNER_TOKEN ??= 'content-verify';
const { execute } = await import('../apps/runner/src/execute');

const contentDir = fileURLToPath(new URL('../content', import.meta.url));
const [filterTrack, filterLevel, filterLesson] = (process.argv[2] ?? '').split('/');
const problems: string[] = [];
const seenKeys = new Set<string>();

function expect(condition: boolean, message: string): void {
  if (!condition) problems.push(message);
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** The original short format: three outline-style lessons and five questions. */
function checkOutlineLevel(where: string, course: ContentCourse): void {
  expect(course.lessons.length === 3, `${where}: expected 3 lessons, found ${course.lessons.length}`);
  expect(course.questions.length === 5, `${where}: expected 5 questions, found ${course.questions.length}`);
  for (const lesson of course.lessons) {
    const count = words(lesson.body);
    expect(count >= 250 && count <= 700, `${where}/${lesson.slug}: body is ${count} words (want 250-700)`);
    expect(lesson.body.includes('## Outline'), `${where}/${lesson.slug}: no "## Outline" section`);
    expect(lesson.body.includes('## Key takeaways'), `${where}/${lesson.slug}: no "## Key takeaways" section`);
  }
  expect(course.lab?.tests.length === 3, `${where}: lab has ${course.lab?.tests.length ?? 0} tests (want 3)`);
}

const COURSE_LESSONS = { basic: 10, medium: 8, advanced: 6, professional: 6 } as const;
const COURSE_SECTIONS = ['## Outline', '## Common mistakes', '## Practice', '### Answers', '## Key takeaways', '## Further reading'];

/** A full course lesson: long enough to teach, with examples, practice and the sources it rests on. */
function checkCourseLesson(where: string, body: string): void {
  const count = words(body);
  expect(count >= 600 && count <= 1600, `${where}: body is ${count} words (want 600-1600)`);
  for (const section of COURSE_SECTIONS) expect(body.includes(`\n${section}`) || body.startsWith(section), `${where}: no "${section}" section`);
  const examples = (body.match(/^```\S/gm) ?? []).length;
  expect(examples >= 3, `${where}: ${examples} code example(s) (want at least 3, each fence naming its language)`);
  const sources = (body.split('## Further reading')[1] ?? '').match(/\]\(https:\/\/[^)\s]+\)/g) ?? [];
  expect(sources.length >= 2, `${where}: "Further reading" has ${sources.length} link(s) (want at least 2)`);
}

/** The full format: a course that starts from zero, with a question for every lesson. */
function checkCourseLevel(where: string, course: ContentCourse): void {
  const wantLessons = COURSE_LESSONS[course.level];
  expect(course.lessons.length >= wantLessons, `${where}: ${course.lessons.length} lessons (want at least ${wantLessons})`);
  const wantQuestions = Math.max(12, course.lessons.length);
  expect(course.questions.length >= wantQuestions, `${where}: ${course.questions.length} questions (want at least ${wantQuestions})`);
  for (const lesson of course.lessons) checkCourseLesson(`${where}/${lesson.slug}`, lesson.body);
  expect((course.lab?.tests.length ?? 0) >= 3, `${where}: lab has ${course.lab?.tests.length ?? 0} tests (want at least 3)`);
}

function checkStructure(where: string, track: ContentTrack, course: ContentCourse): void {
  if (track.format === 'course') checkCourseLevel(where, course);
  else checkOutlineLevel(where, course);
  expect(course.lab !== null, `${where}: no lab`);
  expect(course.lab?.tests.some((t) => !t.hidden) ?? true, `${where}: lab has no visible test`);
  for (const question of course.questions) {
    expect(!seenKeys.has(question.key), `${where}: duplicate question key ${question.key}`);
    seenKeys.add(question.key);
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

/** Practice labs: each belongs to a lesson of the level and is held to the same proof as any lab. */
async function checkPractice(where: string, course: ContentCourse): Promise<void> {
  for (const lab of course.practice) {
    if (filterLesson && lab.lesson !== filterLesson) continue;
    const at = `${where}/${lab.lesson}`;
    expect(course.lessons.some((lesson) => lesson.slug === lab.lesson), `${at}: practice lab for a lesson that does not exist`);
    expect(lab.tests.length >= 3, `${at}: practice lab has ${lab.tests.length} tests (want at least 3)`);
    expect(lab.tests.some((t) => !t.hidden), `${at}: practice lab has no visible test`);
    console.log(`    practice ${lab.lesson.padEnd(40)} ${await checkLab(at, lab)}`);
  }
}

async function checkTrack(track: ContentTrack): Promise<void> {
  if (!filterLevel) problems.push(...trackProblems(track));
  for (const course of track.courses) {
    if (filterLevel && course.level !== filterLevel) continue;
    const where = `${track.slug}/${course.level}`;
    if (!filterLesson) {
      checkStructure(where, track, course);
      const labNote = course.lab ? await checkLab(where, course.lab) : 'no lab';
      console.log(`  ${where.padEnd(34)} ${course.lessons.length} lessons, ${course.questions.length} questions, ${labNote}`);
    }
    await checkPractice(where, course);
  }
}

// Load only the track being verified, so a half-written neighbor cannot break the run.
const tracks = loadContent(contentDir, filterTrack ? [filterTrack] : undefined);
if (tracks.length === 0) problems.push(`No track matches "${filterTrack}"`);
console.log(`Verifying ${tracks.length} track(s)\n`);
for (const track of tracks) await checkTrack(track);
for (const file of ignoredContent(contentDir)) {
  if (!filterTrack || file.startsWith(`tracks/${filterTrack}/`)) problems.push(`content/${file}: ignored by git, so a clone would not have it`);
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`- ${problem}\n`);
  process.exit(1);
}
console.log('\nAll content verified.');
