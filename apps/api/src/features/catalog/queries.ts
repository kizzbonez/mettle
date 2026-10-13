import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { exams, questions } from '../../db/schema/assessment';
import { courses, lessons, tracks } from '../../db/schema/catalog';
import { labs } from '../../db/schema/labs';

const published = 'published' as const;

async function countByCourse(table: typeof lessons | typeof labs | typeof exams): Promise<Map<string, number>> {
  const rows = await db
    .select({ courseId: table.courseId, n: count() })
    .from(table)
    .where(eq(table.status, published))
    .groupBy(table.courseId);
  return new Map(rows.filter((r) => r.courseId).map((r) => [r.courseId as string, Number(r.n)]));
}

/** Every published track with its published courses and what each contains. */
export async function publishedTracks() {
  const [trackRows, courseRows, lessonCounts, labCounts, examCounts] = await Promise.all([
    db.select().from(tracks).where(eq(tracks.status, published)).orderBy(asc(tracks.sortOrder)),
    db.select().from(courses).where(eq(courses.status, published)).orderBy(asc(courses.sortOrder)),
    countByCourse(lessons),
    countByCourse(labs),
    countByCourse(exams),
  ]);
  return trackRows.map((track) => ({
    id: track.id,
    slug: track.slug,
    title: track.title,
    tagline: track.tagline,
    description: track.description,
    icon: track.icon,
    courses: courseRows
      .filter((course) => course.trackId === track.id)
      .map((course) => ({
        id: course.id,
        level: course.level,
        title: course.title,
        summary: course.summary,
        outcomes: course.outcomes,
        lessonCount: lessonCounts.get(course.id) ?? 0,
        labCount: labCounts.get(course.id) ?? 0,
        examCount: examCounts.get(course.id) ?? 0,
      })),
  }));
}

export type PublishedTrack = Awaited<ReturnType<typeof publishedTracks>>[number];

/** Headline numbers for the landing page. Only published content is counted. */
export async function catalogStats() {
  const one = async (query: Promise<{ n: number }[]>) => Number((await query)[0]?.n ?? 0);
  const [trackCount, lessonCount, questionCount, labCount] = await Promise.all([
    one(db.select({ n: count() }).from(tracks).where(eq(tracks.status, published))),
    one(db.select({ n: count() }).from(lessons).where(eq(lessons.status, published))),
    one(db.select({ n: count() }).from(questions).where(eq(questions.status, published))),
    one(db.select({ n: count() }).from(labs).where(eq(labs.status, published))),
  ]);
  return { tracks: trackCount, lessons: lessonCount, questions: questionCount, labs: labCount };
}

/** Track-wide exams: assessments that belong to no single course and draw from every level. */
export async function trackExams(trackId: string) {
  return db
    .select({ id: exams.id, title: exams.title, description: exams.description, timeLimitMinutes: exams.timeLimitMinutes })
    .from(exams)
    .where(and(eq(exams.trackId, trackId), isNull(exams.courseId), eq(exams.status, published)))
    .orderBy(asc(exams.sortOrder));
}
