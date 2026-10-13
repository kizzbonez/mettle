import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { courses, tracks } from './catalog';
import { createdAt, id, ts, updatedAt } from './columns';
import { attemptStatus, difficulty, examMode, publishStatus, questionType } from './enums';
import { users } from './identity';

/** Question taxonomy (networking, cyber, programming, ...). One level of nesting. */
export const categories = pgTable(
  'categories',
  {
    id: id(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    parentId: uuid('parent_id'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('categories_slug_key').on(t.slug)],
);

/** The question bank. Exams draw from it; a question belongs to no single exam. */
export const questions = pgTable(
  'questions',
  {
    id: id(),
    /** Stable key for content shipped as files, so re-seeding updates in place. */
    key: text('key'),
    trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    difficulty: difficulty('difficulty').notNull(),
    type: questionType('type').notNull().default('single'),
    promptMd: text('prompt_md').notNull(),
    explanationMd: text('explanation_md').notNull().default(''),
    tags: text('tags').array().notNull().default([]),
    status: publishStatus('status').notNull().default('draft'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('questions_key_key').on(t.key),
    // The exam generator filters on exactly these columns.
    index('questions_pool_idx').on(t.status, t.trackId, t.difficulty),
    index('questions_category_idx').on(t.categoryId),
    index('questions_tags_idx').using('gin', t.tags),
  ],
);

export const questionOptions = pgTable(
  'question_options',
  {
    id: id(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    bodyMd: text('body_md').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('question_options_question_idx').on(t.questionId)],
);

export const exams = pgTable(
  'exams',
  {
    id: id(),
    trackId: uuid('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    /** Null for a track-wide exam that is not part of one course. */
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    /** fixed: the pinned exam_questions. dynamic: sampled per attempt from exam_rules. */
    mode: examMode('mode').notNull().default('dynamic'),
    timeLimitMinutes: integer('time_limit_minutes').notNull().default(15),
    passPercent: integer('pass_percent').notNull().default(70),
    shuffleOptions: boolean('shuffle_options').notNull().default(true),
    /** Null means unlimited attempts. */
    maxAttempts: integer('max_attempts'),
    status: publishStatus('status').notNull().default('draft'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('exams_track_slug_key').on(t.trackId, t.slug), index('exams_course_idx').on(t.courseId)],
);

/** Blueprint for a dynamic exam: "take `count` questions matching these filters". */
export const examRules = pgTable(
  'exam_rules',
  {
    id: id(),
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
    difficulty: difficulty('difficulty'),
    tag: text('tag'),
    count: integer('count').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('exam_rules_exam_idx').on(t.examId)],
);

export const examQuestions = pgTable(
  'exam_questions',
  {
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.examId, t.questionId] })],
);

export const examAttempts = pgTable(
  'exam_attempts',
  {
    id: id(),
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: attemptStatus('status').notNull().default('in_progress'),
    startedAt: ts('started_at').notNull().defaultNow(),
    expiresAt: ts('expires_at').notNull(),
    submittedAt: ts('submitted_at'),
    correctCount: integer('correct_count'),
    totalCount: integer('total_count').notNull(),
    scorePercent: numeric('score_percent', { precision: 5, scale: 2, mode: 'number' }),
    passed: boolean('passed'),
  },
  (t) => [
    index('exam_attempts_user_idx').on(t.userId, t.startedAt),
    index('exam_attempts_exam_idx').on(t.examId),
    index('exam_attempts_submitted_idx').on(t.submittedAt),
  ],
);

/** The questions one attempt was dealt, in the order and option order it saw them. */
export const attemptQuestions = pgTable(
  'attempt_questions',
  {
    id: id(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => examAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    optionOrder: jsonb('option_order').$type<string[]>().notNull(),
    selectedOptionIds: jsonb('selected_option_ids').$type<string[]>().notNull().default([]),
    flagged: boolean('flagged').notNull().default(false),
    isCorrect: boolean('is_correct'),
    answeredAt: ts('answered_at'),
  },
  (t) => [
    uniqueIndex('attempt_questions_key').on(t.attemptId, t.questionId),
    index('attempt_questions_question_idx').on(t.questionId),
  ],
);
