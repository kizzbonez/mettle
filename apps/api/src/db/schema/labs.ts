import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { courses, lessons } from './catalog';
import { createdAt, id, ts, updatedAt } from './columns';
import { labLanguage, publishStatus, submissionKind, submissionStatus } from './enums';
import { users } from './identity';

export interface LabFixture {
  path: string;
  content: string;
}

export const labs = pgTable(
  'labs',
  {
    id: id(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    /** Set on a practice lab: the lesson whose material it lets the learner try. Null for the level's own lab. */
    lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    scenarioMd: text('scenario_md').notNull().default(''),
    instructionsMd: text('instructions_md').notNull().default(''),
    language: labLanguage('language').notNull(),
    starterCode: text('starter_code').notNull().default(''),
    /** Reference solution. Never sent to learners; used to verify the tests. */
    solutionCode: text('solution_code').notNull().default(''),
    /** Read-only support files placed next to the learner's code in the sandbox. */
    fixtures: jsonb('fixtures').$type<LabFixture[]>().notNull().default([]),
    timeLimitMs: integer('time_limit_ms').notNull().default(5000),
    memoryMb: integer('memory_mb').notNull().default(256),
    estMinutes: integer('est_minutes').notNull().default(30),
    status: publishStatus('status').notNull().default('draft'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('labs_course_slug_key').on(t.courseId, t.slug), index('labs_lesson_idx').on(t.lessonId)],
);

export const labTestCases = pgTable(
  'lab_test_cases',
  {
    id: id(),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Test body in the lab's language; the runner wraps it in a harness. */
    code: text('code').notNull(),
    /** Hidden tests run only on Submit, and their source is never shown. */
    hidden: boolean('hidden').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('lab_test_cases_lab_idx').on(t.labId)],
);

export const labSubmissions = pgTable(
  'lab_submissions',
  {
    id: id(),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: submissionKind('kind').notNull(),
    code: text('code').notNull(),
    status: submissionStatus('status').notNull().default('queued'),
    passedCount: integer('passed_count').notNull().default(0),
    totalCount: integer('total_count').notNull().default(0),
    durationMs: integer('duration_ms'),
    compileOutput: text('compile_output').notNull().default(''),
    errorMessage: text('error_message'),
    createdAt: createdAt(),
    finishedAt: ts('finished_at'),
  },
  (t) => [
    index('lab_submissions_user_lab_idx').on(t.userId, t.labId, t.createdAt),
    index('lab_submissions_created_idx').on(t.createdAt),
    index('lab_submissions_status_idx').on(t.status),
  ],
);

export const submissionResults = pgTable(
  'submission_results',
  {
    id: id(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => labSubmissions.id, { onDelete: 'cascade' }),
    testCaseId: uuid('test_case_id').references(() => labTestCases.id, { onDelete: 'set null' }),
    /** Copied from the test case, so history survives edits to the lab. */
    name: text('name').notNull(),
    hidden: boolean('hidden').notNull(),
    passed: boolean('passed').notNull(),
    timedOut: boolean('timed_out').notNull().default(false),
    exitCode: integer('exit_code'),
    durationMs: integer('duration_ms').notNull().default(0),
    stdout: text('stdout').notNull().default(''),
    stderr: text('stderr').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('submission_results_submission_idx').on(t.submissionId)],
);

/** The learner's unsaved work, restored when they reopen the lab. */
export const labDrafts = pgTable(
  'lab_drafts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    labId: uuid('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.labId] })],
);
