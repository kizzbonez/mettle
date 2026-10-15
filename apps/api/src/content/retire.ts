import { and, eq, inArray } from 'drizzle-orm';
import type { Tx } from '../db/client';
import { questions } from '../db/schema/assessment';
import { courses, lessons } from '../db/schema/catalog';
import { labs } from '../db/schema/labs';
import type { ContentTrack } from './types';

const archived = { status: 'archived' as const };

/** Groups `level/slug` references by level. */
function byLevel(refs: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const ref of refs) {
    const [level = '', slug = ''] = ref.split('/');
    groups.set(level, [...(groups.get(level) ?? []), slug]);
  }
  return groups;
}

/**
 * Archives what an earlier revision of the track shipped and this one names as retired. Archived
 * items are hidden from learners and from new exam papers, but kept with the progress, attempts
 * and submissions that point at them. Only the items named are touched, so content a site
 * created itself is never affected.
 */
export async function retireShipped(trackId: string, retired: ContentTrack['retired'], tx: Tx): Promise<void> {
  const levels = await tx.select({ id: courses.id, slug: courses.slug }).from(courses).where(eq(courses.trackId, trackId));
  const courseOf = new Map(levels.map((row) => [row.slug, row.id]));
  for (const [level, slugs] of byLevel(retired.lessons)) {
    const courseId = courseOf.get(level);
    if (courseId) await tx.update(lessons).set({ ...archived, updatedAt: new Date() }).where(and(eq(lessons.courseId, courseId), inArray(lessons.slug, slugs)));
  }
  for (const [level, slugs] of byLevel(retired.labs)) {
    const courseId = courseOf.get(level);
    if (courseId) await tx.update(labs).set({ ...archived, updatedAt: new Date() }).where(and(eq(labs.courseId, courseId), inArray(labs.slug, slugs)));
  }
  if (retired.questions.length > 0) {
    await tx.update(questions).set({ ...archived, updatedAt: new Date() }).where(and(eq(questions.trackId, trackId), inArray(questions.key, retired.questions)));
  }
}
