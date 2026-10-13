import { DIFFICULTIES, levelInfo, type Difficulty } from '@mettle/shared';
import { eq } from 'drizzle-orm';
import { db, type Tx } from '../db/client';
import { examRules, exams } from '../db/schema/assessment';
import { courses, lessons, tracks } from '../db/schema/catalog';
import { labs, labTestCases } from '../db/schema/labs';
import { loadContent } from './load';
import { upsertQuestion } from './seed-questions';
import type { ContentCourse, ContentLab, ContentTrack } from './types';

const published = 'published' as const;
const QUESTIONS_PER_LEVEL_IN_ASSESSMENT = 3;

async function upsertLessons(courseId: string, course: ContentCourse, tx: Tx): Promise<void> {
  for (const [sortOrder, lesson] of course.lessons.entries()) {
    const values = {
      courseId, slug: lesson.slug, title: lesson.title, summary: lesson.summary, objectives: lesson.objectives,
      bodyMd: lesson.body, estMinutes: lesson.minutes, status: published, sortOrder,
    };
    await tx.insert(lessons).values(values).onConflictDoUpdate({ target: [lessons.courseId, lessons.slug], set: { ...values, updatedAt: new Date() } });
  }
}

async function upsertLab(courseId: string, lab: ContentLab, tx: Tx): Promise<void> {
  const values = {
    courseId, slug: lab.slug, title: lab.title, summary: lab.summary, scenarioMd: lab.scenario,
    instructionsMd: lab.instructions, language: lab.language, starterCode: lab.starter, solutionCode: lab.solution,
    fixtures: lab.fixtures, timeLimitMs: lab.timeLimitMs, memoryMb: lab.memoryMb, estMinutes: lab.minutes, status: published,
  };
  const [row] = await tx
    .insert(labs)
    .values(values)
    .onConflictDoUpdate({ target: [labs.courseId, labs.slug], set: { ...values, updatedAt: new Date() } })
    .returning({ id: labs.id });
  if (!row) throw new Error(`Could not save lab ${lab.slug}`);
  await tx.delete(labTestCases).where(eq(labTestCases.labId, row.id));
  await tx.insert(labTestCases).values(lab.tests.map((test, sortOrder) => ({ labId: row.id, ...test, sortOrder })));
}

interface ExamSeed {
  trackId: string;
  courseId: string | null;
  slug: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passPercent: number;
  rules: { difficulty: Difficulty; count: number }[];
}

/** A dynamic exam whose blueprint draws from this track's bank by difficulty. */
async function upsertExam(seed: ExamSeed, tx: Tx): Promise<void> {
  const { rules, ...values } = seed;
  const row = { ...values, mode: 'dynamic' as const, status: published };
  const [exam] = await tx
    .insert(exams)
    .values(row)
    .onConflictDoUpdate({ target: [exams.trackId, exams.slug], set: { ...row, updatedAt: new Date() } })
    .returning({ id: exams.id });
  if (!exam) throw new Error(`Could not save exam ${seed.slug}`);
  await tx.delete(examRules).where(eq(examRules.examId, exam.id));
  await tx.insert(examRules).values(rules.map((rule, sortOrder) => ({ examId: exam.id, trackId: seed.trackId, ...rule, sortOrder })));
}

async function seedCourse(trackId: string, track: ContentTrack, course: ContentCourse, tx: Tx, categories: Map<string, string>): Promise<void> {
  const values = {
    trackId, slug: course.level, level: course.level, title: course.title, summary: course.summary,
    outcomes: course.outcomes, status: published, sortOrder: levelInfo(course.level).rank,
  };
  const [row] = await tx
    .insert(courses)
    .values(values)
    .onConflictDoUpdate({ target: [courses.trackId, courses.slug], set: { ...values, updatedAt: new Date() } })
    .returning({ id: courses.id });
  if (!row) throw new Error(`Could not save course ${track.slug}/${course.level}`);
  await upsertLessons(row.id, course, tx);
  for (const question of course.questions) {
    await upsertQuestion(question, { trackId, difficulty: course.level, defaultCategory: track.category, categories }, tx);
  }
  if (course.lab) await upsertLab(row.id, course.lab, tx);
  if (course.questions.length > 0) {
    const { questionCount, ...exam } = course.exam;
    const count = Math.min(course.questions.length, questionCount);
    await upsertExam({ trackId, courseId: row.id, slug: `${course.level}-mock-exam`, ...exam, rules: [{ difficulty: course.level, count }] }, tx);
  }
}

async function seedTrack(track: ContentTrack, tx: Tx, categories: Map<string, string>): Promise<void> {
  const values = { slug: track.slug, title: track.title, tagline: track.tagline, description: track.description, icon: track.icon, status: published, sortOrder: track.sortOrder };
  // `format` and `revision` describe the files, not the track: they are read by the checker and the sync.
  const [row] = await tx
    .insert(tracks)
    .values(values)
    .onConflictDoUpdate({ target: tracks.slug, set: { ...values, updatedAt: new Date() } })
    .returning({ id: tracks.id });
  if (!row) throw new Error(`Could not save track ${track.slug}`);
  for (const course of track.courses) await seedCourse(row.id, track, course, tx, categories);

  // With more than one level, add an assessment that samples across all of them.
  const levels = DIFFICULTIES.filter((level) => track.courses.some((c) => c.level === level && c.questions.length > 0));
  if (levels.length < 2) return;
  await upsertExam({
    trackId: row.id, courseId: null, slug: 'track-assessment', title: `${track.title} Track Assessment`,
    description: `A fresh paper every attempt: ${QUESTIONS_PER_LEVEL_IN_ASSESSMENT} questions drawn at random from each level of the track.`,
    timeLimitMinutes: 20, passPercent: 70,
    rules: levels.map((difficulty) => ({ difficulty, count: QUESTIONS_PER_LEVEL_IN_ASSESSMENT })),
  }, tx);
}

/** Loads the files under `contentDir` into the database. Safe to run again: it updates in place. */
export async function seedContent(contentDir: string, only?: string[]): Promise<{ tracks: number; courses: number }> {
  const content = loadContent(contentDir, only);
  await db.transaction(async (tx) => {
    const categories = new Map<string, string>();
    for (const track of content) await seedTrack(track, tx, categories);
  });
  return { tracks: content.length, courses: content.reduce((n, track) => n + track.courses.length, 0) };
}
