// Writes docs/CURRICULUM.md from the files under content/, so the document
// can never drift from what the platform actually teaches.
//
//   npm run docs:curriculum
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LAB_LANGUAGE_LABEL, LAB_SOLUTION_FILE, levelInfo, type LabLanguage } from '@mettle/shared';
import { loadContent } from '../apps/api/src/content/load';
import type { ContentCourse, ContentLab, ContentLesson, ContentQuestion, ContentTrack } from '../apps/api/src/content/types';

const contentDir = fileURLToPath(new URL('../content', import.meta.url));
const target = fileURLToPath(new URL('../docs/CURRICULUM.md', import.meta.url));
const LETTERS = 'ABCDEFGH';

const anchor = (text: string) => text.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
const indent = (text: string, by: string) => text.split('\n').map((line) => (line ? by + line : line)).join('\n');

/** The numbered list under "## Outline" in a lesson body. */
function outlineOf(lesson: ContentLesson): string[] {
  const match = /## Outline\s*\n([\s\S]*?)(?=\n## |\s*$)/.exec(lesson.body);
  return (match?.[1] ?? '').split('\n').map((line) => line.trim()).filter((line) => /^\d+\./.test(line));
}

function lessonSection(lesson: ContentLesson, index: number): string {
  return [
    `#### Lesson ${index + 1}: ${lesson.title}`,
    '',
    `*${lesson.minutes} minutes.* ${lesson.summary}`,
    '',
    '**Objectives**',
    '',
    ...lesson.objectives.map((objective) => `- ${objective}`),
    '',
    '**Outline**',
    '',
    ...outlineOf(lesson),
    '',
  ].join('\n');
}

const TYPE_LABEL = { single: 'One answer', multiple: 'Select all that apply', true_false: 'True or false' };

function questionSection(question: ContentQuestion, index: number): string {
  const options = question.options.map((option, i) => {
    const text = indent(option.text.trim(), '   ').trimStart();
    return `- ${option.correct ? '**✔' : ''} ${LETTERS[i]}. ${text}${option.correct ? '**' : ''}`.replace('-  ', '- ');
  });
  return [
    `**Question ${index + 1}** · ${TYPE_LABEL[question.type]} · \`${question.key}\``,
    '',
    question.prompt.trim(),
    '',
    ...options,
    '',
    `> **Why:** ${question.explanation.trim().replace(/\n/g, '\n> ')}`,
    '',
  ].join('\n');
}

/** The language a lab's tests are written in. A YAML lab is checked by Python. */
const TEST_FENCE: Record<LabLanguage, string> = { rust: 'rust', python: 'python', bash: 'bash', cpp: 'cpp', csharp: 'csharp', yaml: 'python' };

function labSection(lab: ContentLab, where: string): string {
  const ext = LAB_SOLUTION_FILE[lab.language].split('.').pop();
  const fence = lab.language;
  const tests = lab.tests.map((test, i) =>
    [`**Test ${i + 1}: ${test.name}** (${test.hidden ? 'hidden' : 'visible'})`, '', `\`\`\`${TEST_FENCE[lab.language]}`, test.code, '```', ''].join('\n'),
  );
  return [
    `#### Lab: ${lab.title}`,
    '',
    `*${LAB_LANGUAGE_LABEL[lab.language]} · about ${lab.minutes} minutes · ${lab.timeLimitMs / 1000} s per test.* ${lab.summary}`,
    '',
    '**Scenario**',
    '',
    lab.scenario,
    '',
    '**Instructions**',
    '',
    lab.instructions,
    '',
    `**Boilerplate given to the learner** (\`starter.${ext}\`)`,
    '',
    `\`\`\`${fence}`,
    lab.starter.trimEnd(),
    '```',
    '',
    '**Test cases the backend runs**',
    '',
    ...tests,
    `The reference solution is [\`content/tracks/${where}/lab/solution.${ext}\`](../content/tracks/${where}/lab/solution.${ext}).`,
    '',
  ].join('\n');
}

function courseSection(track: ContentTrack, course: ContentCourse): string {
  const level = levelInfo(course.level);
  return [
    `### Level ${level.mark} · ${level.label}: ${course.title}`,
    '',
    course.summary,
    '',
    '**After this level you can**',
    '',
    ...course.outcomes.map((outcome) => `- ${outcome}`),
    '',
    ...course.lessons.map(lessonSection),
    `#### Mock exam: ${course.exam.title}`,
    '',
    `*${course.questions.length} questions · ${course.exam.timeLimitMinutes} minutes · pass mark ${course.exam.passPercent}%.* ${course.exam.description}`,
    '',
    ...course.questions.map(questionSection),
    course.lab ? labSection(course.lab, `${track.slug}/${course.level}`) : '',
  ].join('\n');
}

function trackSection(track: ContentTrack): string {
  return [`## ${track.title}`, '', `*${track.tagline}*`, '', track.description, '', ...track.courses.map((course) => courseSection(track, course))].join('\n');
}

const tracks = loadContent(contentDir);
const count = (pick: (course: ContentCourse) => number) => tracks.reduce((n, t) => n + t.courses.reduce((m, c) => m + pick(c), 0), 0);
const contents = tracks.flatMap((track) => [
  `- [${track.title}](#${anchor(track.title)})`,
  ...track.courses.map((course) => {
    const heading = `Level ${levelInfo(course.level).mark} · ${levelInfo(course.level).label}: ${course.title}`;
    return `  - [${heading}](#${anchor(heading)})`;
  }),
]);

const header = [
  '# Curriculum',
  '',
  '<!-- Generated by `npm run docs:curriculum` from the files under content/. Do not edit by hand. -->',
  '',
  `${tracks.length} tracks, ${count(() => 1)} levels, ${count((c) => c.lessons.length)} lessons, ${count((c) => c.questions.length)} exam questions and ${count((c) => (c.lab ? 1 : 0))} labs.`,
  'Every lab listed here has been run in the sandbox: its reference solution passes all of its tests, and its boilerplate builds but does not.',
  '',
  'Each level has the same shape: three lessons, a five-question mock exam, and one hands-on lab with three test cases',
  '(the first visible to the learner, the other two hidden). In a mock exam, the correct option is marked ✔.',
  '',
  ...contents,
  '',
].join('\n');

writeFileSync(target, `${header}\n${tracks.map(trackSection).join('\n')}`.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
console.log(`Wrote docs/CURRICULUM.md (${tracks.length} tracks).`);
