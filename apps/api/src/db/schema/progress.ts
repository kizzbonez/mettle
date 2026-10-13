import { index, jsonb, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { courses, lessons } from './catalog';
import { createdAt, id, ts } from './columns';
import { users } from './identity';

export const enrollments = pgTable(
  'enrollments',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    enrolledAt: ts('enrolled_at').notNull().defaultNow(),
    completedAt: ts('completed_at'),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] }), index('enrollments_course_idx').on(t.courseId)],
);

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    completedAt: ts('completed_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

/**
 * Append-only feed behind "recent activity". Exam and lab outcomes are still
 * read from their own tables; this is a denormalized timeline, not the record.
 */
export const activityEvents = pgTable(
  'activity_events',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    href: text('href'),
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index('activity_events_user_idx').on(t.userId, t.createdAt)],
);
