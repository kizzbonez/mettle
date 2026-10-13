import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { courses, tracks } from '../../db/schema/catalog';
import { enrollments } from '../../db/schema/progress';
import { notFound } from '../../lib/errors';
import { recordActivity } from '../progress/activity';

/** A published course in a published track, or a 404. Drafts do not exist for learners. */
export async function publishedCourse(courseId: string) {
  const [row] = await db
    .select({ course: courses, track: tracks })
    .from(courses)
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .where(and(eq(courses.id, courseId), eq(courses.status, 'published'), eq(tracks.status, 'published')))
    .limit(1);
  if (!row) throw notFound('Course');
  return row;
}

/**
 * Opening any lesson, exam or lab enrolls the learner in its course. Returns
 * true the first time, so the caller can tell a new enrollment from a repeat.
 */
export async function ensureEnrolled(userId: string, course: { id: string; title: string }): Promise<boolean> {
  const created = await db
    .insert(enrollments)
    .values({ userId, courseId: course.id })
    .onConflictDoNothing()
    .returning({ courseId: enrollments.courseId });
  if (created.length === 0) return false;
  await recordActivity({ userId, kind: 'enrolled', title: course.title, href: `/courses/${course.id}` });
  return true;
}
