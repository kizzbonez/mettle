import { and, asc, eq, gt } from 'drizzle-orm';
import { db } from '../../db/client';
import { lessons } from '../../db/schema/catalog';
import { labs, labSubmissions } from '../../db/schema/labs';

/**
 * A practice lab is a lab attached to one lesson (`labs.lesson_id`), so what
 * the lesson taught can be tried at once. These are the lookups that connect
 * the two: from a lesson to its lab, and from a lab back to where it sits.
 */

const published = 'published' as const;

/** A lab counts as passed once a submission (not a practice run) has passed every test. */
export async function hasPassed(userId: string, labId: string): Promise<boolean> {
  const rows = await db
    .select({ id: labSubmissions.id })
    .from(labSubmissions)
    .where(and(eq(labSubmissions.userId, userId), eq(labSubmissions.labId, labId), eq(labSubmissions.kind, 'submit'), eq(labSubmissions.status, 'passed')))
    .limit(1);
  return rows.length > 0;
}

/** The practice lab of a lesson, with whether this learner has passed it. */
export async function practiceOfLesson(userId: string, lessonId: string) {
  const [lab] = await db
    .select({ id: labs.id, title: labs.title, summary: labs.summary, estMinutes: labs.estMinutes })
    .from(labs)
    .where(and(eq(labs.lessonId, lessonId), eq(labs.status, published)))
    .orderBy(asc(labs.sortOrder))
    .limit(1);
  return lab ? { ...lab, done: await hasPassed(userId, lab.id) } : null;
}

/** For a practice lab: its lesson and the lesson after it, so the workspace can lead the learner on. */
export async function lessonAround(lessonId: string | null) {
  if (!lessonId) return { lesson: null, nextLesson: null };
  const [lesson] = await db.select().from(lessons).where(and(eq(lessons.id, lessonId), eq(lessons.status, published))).limit(1);
  if (!lesson) return { lesson: null, nextLesson: null };
  const [next] = await db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .where(and(eq(lessons.courseId, lesson.courseId), eq(lessons.status, published), gt(lessons.sortOrder, lesson.sortOrder)))
    .orderBy(asc(lessons.sortOrder))
    .limit(1);
  return { lesson: { id: lesson.id, title: lesson.title }, nextLesson: next ?? null };
}
