import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { courses, tracks } from '../../db/schema/catalog';
import { enrollments } from '../../db/schema/progress';
import { publishedTracks } from '../catalog/queries';
import { courseSyllabus, nextItem, type NextItem } from '../catalog/syllabus';
import { courseProgress } from './course-progress';

/** Courses the learner has joined, most recent first, with progress and what to do next. */
export async function myCourses(userId: string) {
  const rows = await db
    .select({ course: courses, track: tracks, enrolledAt: enrollments.enrolledAt, completedAt: enrollments.completedAt })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .where(and(eq(enrollments.userId, userId), eq(courses.status, 'published'), eq(tracks.status, 'published')))
    .orderBy(desc(enrollments.enrolledAt));
  const progress = await courseProgress(userId, rows.map((row) => row.course.id));
  return Promise.all(
    rows.map(async (row) => ({
      id: row.course.id,
      title: row.course.title,
      summary: row.course.summary,
      level: row.course.level,
      track: { id: row.track.id, slug: row.track.slug, title: row.track.title, icon: row.track.icon },
      enrolledAt: row.enrolledAt,
      completed: row.completedAt !== null,
      progress: progress.get(row.course.id) ?? { total: 0, done: 0, percent: 0 },
      next: row.completedAt ? null : nextItem(await courseSyllabus(userId, row.course.id)),
    })),
  );
}

export type MyCourse = Awaited<ReturnType<typeof myCourses>>[number];

export interface Recommendation extends Omit<NextItem, 'kind'> {
  kind: NextItem['kind'] | 'course';
  reason: string;
  course: { id: string; title: string; level: string };
  track: string;
}

/**
 * What to do next. For someone mid-course it is the next unfinished item of
 * each course; for someone who finished a level it is the next level of that
 * track; for a new learner it is the first level of each track.
 */
export async function recommendations(userId: string, mine: MyCourse[], limit = 3): Promise<Recommendation[]> {
  const picks: Recommendation[] = [];
  for (const course of mine) {
    if (!course.next) continue;
    picks.push({
      ...course.next,
      reason: course.progress.done === 0 ? 'Start here' : 'Continue where you left off',
      course: { id: course.id, title: course.title, level: course.level },
      track: course.track.title,
    });
  }
  if (picks.length >= limit) return picks.slice(0, limit);

  const joined = new Set(mine.map((course) => course.id));
  for (const track of await publishedTracks()) {
    const candidate = track.courses.find((course) => !joined.has(course.id));
    if (!candidate) continue;
    const startedTrack = track.courses.some((course) => joined.has(course.id));
    picks.push({
      kind: 'course',
      id: candidate.id,
      title: candidate.title,
      href: `/courses/${candidate.id}`,
      reason: startedTrack ? 'Next level in this track' : 'New track to explore',
      course: { id: candidate.id, title: candidate.title, level: candidate.level },
      track: track.title,
    });
  }
  return picks.slice(0, limit);
}
