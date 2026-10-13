import { index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './columns';
import { difficulty, publishStatus } from './enums';

/** A subject, such as Rust Development. New subjects are new rows, not new code. */
export const tracks = pgTable(
  'tracks',
  {
    id: id(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    tagline: text('tagline').notNull().default(''),
    description: text('description').notNull().default(''),
    /** Name of a Lucide icon. */
    icon: text('icon').notNull().default('Boxes'),
    status: publishStatus('status').notNull().default('draft'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('tracks_slug_key').on(t.slug)],
);

/** One level of a track. Lessons, exams and labs hang off a course. */
export const courses = pgTable(
  'courses',
  {
    id: id(),
    trackId: uuid('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    level: difficulty('level').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    outcomes: jsonb('outcomes').$type<string[]>().notNull().default([]),
    status: publishStatus('status').notNull().default('draft'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('courses_track_slug_key').on(t.trackId, t.slug),
    index('courses_track_idx').on(t.trackId),
  ],
);

export const lessons = pgTable(
  'lessons',
  {
    id: id(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    objectives: jsonb('objectives').$type<string[]>().notNull().default([]),
    bodyMd: text('body_md').notNull().default(''),
    estMinutes: integer('est_minutes').notNull().default(15),
    status: publishStatus('status').notNull().default('draft'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('lessons_course_slug_key').on(t.courseId, t.slug)],
);
