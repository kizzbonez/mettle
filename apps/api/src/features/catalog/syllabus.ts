import { and, asc, count, eq, inArray, max, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { examAttempts, exams } from '../../db/schema/assessment';
import { lessons } from '../../db/schema/catalog';
import { labs, labSubmissions } from '../../db/schema/labs';
import { lessonProgress } from '../../db/schema/progress';

const published = 'published' as const;

async function lessonItems(userId: string, courseId: string) {
  const rows = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      summary: lessons.summary,
      estMinutes: lessons.estMinutes,
      completedAt: lessonProgress.completedAt,
    })
    .from(lessons)
    .leftJoin(lessonProgress, and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.userId, userId)))
    .where(and(eq(lessons.courseId, courseId), eq(lessons.status, published)))
    .orderBy(asc(lessons.sortOrder));
  return rows.map(({ completedAt, ...lesson }) => ({ ...lesson, done: completedAt !== null }));
}

async function examItems(userId: string, courseId: string) {
  const rows = await db
    .select()
    .from(exams)
    .where(and(eq(exams.courseId, courseId), eq(exams.status, published)))
    .orderBy(asc(exams.sortOrder));
  if (rows.length === 0) return [];
  const stats = await db
    .select({
      examId: examAttempts.examId,
      attempts: count(),
      best: max(examAttempts.scorePercent),
      passed: sql<boolean>`bool_or(${examAttempts.passed})`,
    })
    .from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), inArray(examAttempts.examId, rows.map((r) => r.id))))
    .groupBy(examAttempts.examId);
  const byExam = new Map(stats.map((s) => [s.examId, s]));
  return rows.map((exam) => ({
    id: exam.id,
    title: exam.title,
    description: exam.description,
    timeLimitMinutes: exam.timeLimitMinutes,
    passPercent: exam.passPercent,
    attempts: Number(byExam.get(exam.id)?.attempts ?? 0),
    bestScore: byExam.get(exam.id)?.best ?? null,
    done: byExam.get(exam.id)?.passed === true,
  }));
}

async function labItems(userId: string, courseId: string) {
  const rows = await db
    .select()
    .from(labs)
    .where(and(eq(labs.courseId, courseId), eq(labs.status, published)))
    .orderBy(asc(labs.sortOrder));
  if (rows.length === 0) return [];
  const stats = await db
    .select({
      labId: labSubmissions.labId,
      attempts: count(),
      passed: sql<boolean>`bool_or(${labSubmissions.status} = 'passed')`,
    })
    .from(labSubmissions)
    .where(and(eq(labSubmissions.userId, userId), eq(labSubmissions.kind, 'submit'), inArray(labSubmissions.labId, rows.map((r) => r.id))))
    .groupBy(labSubmissions.labId);
  const byLab = new Map(stats.map((s) => [s.labId, s]));
  return rows.map((lab) => ({
    id: lab.id,
    lessonId: lab.lessonId,
    title: lab.title,
    summary: lab.summary,
    language: lab.language,
    estMinutes: lab.estMinutes,
    attempts: Number(byLab.get(lab.id)?.attempts ?? 0),
    done: byLab.get(lab.id)?.passed === true,
  }));
}

/** Everything in a course, in study order, with this learner's status on each item. */
export async function courseSyllabus(userId: string, courseId: string) {
  const [lessonList, examList, labList] = await Promise.all([
    lessonItems(userId, courseId),
    examItems(userId, courseId),
    labItems(userId, courseId),
  ]);
  // A lab attached to a lesson here is that lesson's practice; the others are the level's own labs.
  const practice = new Map<string, (typeof labList)[number]>();
  for (const lab of labList) {
    if (lab.lessonId && lessonList.some((lesson) => lesson.id === lab.lessonId) && !practice.has(lab.lessonId)) practice.set(lab.lessonId, lab);
  }
  const attached = new Set([...practice.values()].map((lab) => lab.id));
  return {
    lessons: lessonList.map((lesson) => ({ ...lesson, practice: practice.get(lesson.id) ?? null })),
    exams: examList,
    labs: labList.filter((lab) => !attached.has(lab.id)),
  };
}

export type Syllabus = Awaited<ReturnType<typeof courseSyllabus>>;

export interface NextItem {
  kind: 'lesson' | 'exam' | 'lab';
  id: string;
  title: string;
  href: string;
}

/** The first thing not yet done: each lesson and then its practice lab, then the exam, then the level's lab. */
export function nextItem(syllabus: Syllabus): NextItem | null {
  for (const lesson of syllabus.lessons) {
    if (!lesson.done) return { kind: 'lesson', id: lesson.id, title: lesson.title, href: `/lessons/${lesson.id}` };
    const { practice } = lesson;
    if (practice && !practice.done) return { kind: 'lab', id: practice.id, title: practice.title, href: `/labs/${practice.id}` };
  }
  const exam = syllabus.exams.find((item) => !item.done);
  if (exam) return { kind: 'exam', id: exam.id, title: exam.title, href: `/exams/${exam.id}` };
  const lab = syllabus.labs.find((item) => !item.done);
  if (lab) return { kind: 'lab', id: lab.id, title: lab.title, href: `/labs/${lab.id}` };
  return null;
}
