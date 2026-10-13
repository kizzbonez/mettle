import type { LabLanguage, PublishStatus } from '@mettle/shared';
import { ApiError, fieldErrors } from '@/lib/api';
import type { AdminLabDetail } from '@/types/content-admin';
import { toInt } from '../shared/labels';

export const LABS = '/admin/content/labs';
export const MAX_FIXTURES = 16;
export const MAX_TESTS = 24;

/** What a test case is in each language; the runner wraps it in a harness. */
export const TEST_HELP: Record<LabLanguage, string> = {
  rust: 'Each test is the body of a function. solution.rs is compiled as a module with everything public in it in scope, so write assert! and assert_eq! with a message that says what was checked.',
  python: 'Each test is a script that begins with "from solution import *". Write plain assert statements, each with a message that says what was checked.',
  bash: 'Each test is a script that runs solution.sh and checks what it printed. Two helpers are available: assert_eq ACTUAL EXPECTED [MESSAGE] and fail MESSAGE.',
  cpp: 'Each test is the body of a function. solution.cpp is included above it, so everything it declares is in scope, along with the common standard headers. Use CHECK(condition, message), CHECK_EQ(actual, expected, message) and CHECK_THROWS(expression, Type, message). A memory error or a leak fails the test.',
  csharp: 'Each test is the body of an async method, so it may await. Declare types without a namespace so the test can name them. Use Check.True(condition, message), Check.Equal(actual, expected, message), Check.SequenceEqual, Check.Throws<T> and Check.ThrowsAsync<T>.',
  yaml: 'Each test is a Python script. solution.yaml is already parsed: doc is the first document, docs is all of them, RAW is the text, and at(doc, "a.b.0") follows a path. Write plain assert statements, each with a message that says what was checked.',
};

export interface FixtureDraft {
  /** Identifies the row on screen. Never sent. */
  key: string;
  path: string;
  content: string;
}

export interface TestDraft {
  key: string;
  name: string;
  code: string;
  hidden: boolean;
}

export interface LabForm {
  courseId: string;
  slug: string;
  title: string;
  summary: string;
  scenarioMd: string;
  instructionsMd: string;
  language: LabLanguage;
  starterCode: string;
  solutionCode: string;
  fixtures: FixtureDraft[];
  timeLimitMs: string;
  memoryMb: string;
  estMinutes: string;
  status: PublishStatus;
  sortOrder: string;
  tests: TestDraft[];
}

let made = 0;
const nextKey = () => `new-${(made += 1)}`;

export const newFixture = (): FixtureDraft => ({ key: nextKey(), path: 'data/', content: '' });
export const newTest = (hidden: boolean): TestDraft => ({ key: nextKey(), name: '', code: '', hidden });

export function blankLab(courseId: string): LabForm {
  return {
    courseId, slug: '', title: '', summary: '', scenarioMd: '', instructionsMd: '', language: 'python', starterCode: '', solutionCode: '',
    fixtures: [], timeLimitMs: '5000', memoryMb: '256', estMinutes: '30', status: 'draft', sortOrder: '0', tests: [newTest(false)],
  };
}

export function labFormOf({ lab, tests }: AdminLabDetail): LabForm {
  return {
    courseId: lab.courseId,
    slug: lab.slug,
    title: lab.title,
    summary: lab.summary,
    scenarioMd: lab.scenarioMd,
    instructionsMd: lab.instructionsMd,
    language: lab.language,
    starterCode: lab.starterCode,
    solutionCode: lab.solutionCode,
    fixtures: lab.fixtures.map((fixture, index) => ({ key: `saved-${index}`, ...fixture })),
    timeLimitMs: String(lab.timeLimitMs),
    memoryMb: String(lab.memoryMb),
    estMinutes: String(lab.estMinutes),
    status: lab.status,
    sortOrder: String(lab.sortOrder),
    tests: tests.map((test) => ({ key: test.id, name: test.name, code: test.code, hidden: test.hidden })),
  };
}

/**
 * On Windows the code editor gives a file started from nothing CRLF line
 * endings. The sandbox runs Linux, where a stray carriage return breaks a bash
 * script outright, so code is always saved with LF.
 */
const withLf = (code: string) => code.replace(/\r\n?/g, '\n');

export function labBodyOf(form: LabForm) {
  return {
    ...form,
    starterCode: withLf(form.starterCode),
    solutionCode: withLf(form.solutionCode),
    timeLimitMs: toInt(form.timeLimitMs),
    memoryMb: toInt(form.memoryMb),
    estMinutes: toInt(form.estMinutes),
    sortOrder: toInt(form.sortOrder),
    fixtures: form.fixtures.map(({ path, content }) => ({ path: path.trim(), content })),
    tests: form.tests.map(({ name, code, hidden }) => ({ name, code, hidden })),
  };
}

export const LAB_FIELDS = [
  'courseId', 'slug', 'title', 'summary', 'scenarioMd', 'instructionsMd', 'language', 'starterCode', 'solutionCode', 'fixtures',
  'timeLimitMs', 'memoryMb', 'estMinutes', 'status', 'sortOrder', 'tests',
];

export type LabTab = 'details' | 'brief' | 'code' | 'fixtures' | 'tests';
export const LAB_TABS: LabTab[] = ['details', 'brief', 'code', 'fixtures', 'tests'];

const TAB_OF: Record<string, LabTab> = {
  scenarioMd: 'brief', instructionsMd: 'brief', starterCode: 'code', solutionCode: 'code', fixtures: 'fixtures', tests: 'tests',
};

/** The tab that shows the field an API error is about (`tests.2.name` is on the tests tab). */
function tabOfField(field: string): LabTab {
  return TAB_OF[field.split('.')[0] ?? ''] ?? 'details';
}

/** The tabs holding something the API refused, in tab order. A duplicate slug is shown on the details tab. */
export function flaggedTabs(error: unknown): LabTab[] {
  if (error instanceof ApiError && error.code === 'already_exists') return ['details'];
  const hit = new Set(Object.keys(fieldErrors(error)).map(tabOfField));
  return LAB_TABS.filter((tab) => hit.has(tab));
}
