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
const TEST_FENCE: Record<LabLanguage, string> = { rust: 'rust', python: 'python', bash: 'bash', cpp: 'cpp', csharp: 'csharp', yaml: 'python', typescript: 'typescript', go: 'go', solidity: 'solidity' };

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

/** A level's practice labs, one line each, in the order of the lessons they follow. */
function practiceSection(course: ContentCourse): string[] {
  if (course.practice.length === 0) return [];
  const order = (slug: string) => course.lessons.findIndex((lesson) => lesson.slug === slug);
  const rows = [...course.practice]
    .sort((a, b) => order(a.lesson) - order(b.lesson))
    .map((lab) => `| ${course.lessons[order(lab.lesson)]?.title ?? lab.lesson} | ${lab.title} | ${lab.summary} |`);
  return [
    '#### Practice labs',
    '',
    'One small lab per lesson, offered at the end of the lesson and checked in the sandbox like any other lab.',
    '',
    '| After the lesson | Practice lab | What the learner does |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ];
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
    ...practiceSection(course),
    `#### Mock exam: ${course.exam.title}`,
    '',
    `*${course.questions.length} questions · ${course.exam.timeLimitMinutes} minutes · pass mark ${course.exam.passPercent}%.* ${course.exam.description}`,
    '',
    ...course.questions.map(questionSection),
    course.lab ? labSection(course.lab, `${track.slug}/${course.level}`) : '',
  ].join('\n');
}

/** Exams the track declares itself, with the blueprint each attempt is drawn from. */
function trackExamsSection(track: ContentTrack): string[] {
  return track.exams.flatMap((exam) => {
    const total = exam.rules.reduce((sum, rule) => sum + rule.count, 0);
    const rules = exam.rules.map((rule) => `- ${rule.count} from ${[rule.category, rule.level].filter(Boolean).join(', ') || 'any question'}`);
    return [`### Track exam: ${exam.title}`, '', `*${total} questions · ${exam.timeLimitMinutes} minutes · pass mark ${exam.passPercent}%.* ${exam.description}`, '', ...rules, ''];
  });
}

function trackSection(track: ContentTrack): string {
  const courses = track.courses.map((course) => courseSection(track, course));
  return [`## ${track.title}`, '', `*${track.tagline}*`, '', track.description, '', ...trackExamsSection(track), ...courses].join('\n');
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
  `${tracks.length} tracks, ${count(() => 1)} levels, ${count((c) => c.lessons.length)} lessons, ${count((c) => c.questions.length)} exam questions and ${count((c) => (c.lab ? 1 : 0) + c.practice.length)} labs (${count((c) => c.practice.length)} of them practice labs attached to a lesson).`,
  'Every lab listed here has been run in the sandbox: its reference solution passes all of its tests, and its boilerplate builds but does not.',
  '',
  'Each level has its lessons, a bank of exam questions that every mock exam attempt draws from, and one hands-on lab',
  '(its first test visible to the learner, the others hidden). In a question, the correct option is marked ✔.',
  '',
  ...contents,
  '',
].join('\n');

writeFileSync(target, `${header}\n${tracks.map(trackSection).join('\n')}`.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
console.log(`Wrote docs/CURRICULUM.md (${tracks.length} tracks).`);
