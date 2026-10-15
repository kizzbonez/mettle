import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, pool } from '../db/client';
import { exams, examRules, questions } from '../db/schema/assessment';
import { courses, lessons, tracks } from '../db/schema/catalog';
import { syncContent } from './sync';

const SLUG = `sync-probe-${Date.now()}`;
const contentDir = mkdtempSync(join(tmpdir(), 'mettle-content-'));
const level = join(contentDir, 'tracks', SLUG, 'basic');

function writeTrack(revision: number, extra: string[] = []): void {
  const lines = ['title: Sync Probe', 'tagline: A track that exists to be synced.', 'description: Used by a test.', 'icon: Boxes', 'category: probe', `revision: ${revision}`, ...extra];
  writeFileSync(join(contentDir, 'tracks', SLUG, 'track.yaml'), `${lines.join('\n')}\n`);
}

function writeLesson(file: string, title: string): void {
  const front = ['---', `title: ${title}`, 'summary: One sentence.', 'minutes: 5', 'objectives:', '  - Know that sync works', '---', '', '## Outline', '', 'Text.', ''];
  writeFileSync(join(level, 'lessons', file), front.join('\n'));
}

function writeQuestions(count: number): void {
  const one = (n: number) => [
    `- key: ${SLUG}-${n}`, '  type: true_false', `  prompt: Statement ${n} is true.`, '  options:', '    - text: "True"', '      correct: true',
    '    - text: "False"', '  explanation: Because it is.',
  ].join('\n');
  writeFileSync(join(level, 'questions.yaml'), `${Array.from({ length: count }, (_, i) => one(i + 1)).join('\n')}\n`);
}

mkdirSync(join(level, 'lessons'), { recursive: true });
const course = ['title: Probe Basics', 'summary: A level.', 'outcomes:', '  - Sync', 'exam:', '  title: Probe Exam', '  questionCount: 2'];
writeFileSync(join(level, 'course.yaml'), `${course.join('\n')}\n`);

async function lessonRows() {
  return db
    .select({ id: lessons.id, slug: lessons.slug, title: lessons.title, status: lessons.status })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .where(eq(tracks.slug, SLUG))
    .orderBy(asc(lessons.sortOrder));
}

afterAll(async () => {
  await db.delete(tracks).where(eq(tracks.slug, SLUG));
  rmSync(contentDir, { recursive: true, force: true });
  await pool.end();
});

describe('syncContent', () => {
  let firstLessonId = '';

  it('adds a shipped track the database has never been given', async () => {
    writeTrack(1);
    writeLesson('01-hello.md', 'Hello');
    writeQuestions(3);
    expect(await syncContent(contentDir)).toEqual({ add: [SLUG], update: [] });
    const rows = await lessonRows();
    expect(rows.map((row) => row.title)).toEqual(['Hello']);
    firstLessonId = rows[0]?.id ?? '';
  });

  it('draws the exam from the bank instead of using every question', async () => {
    const [rule] = await db
      .select({ count: examRules.count })
      .from(examRules)
      .innerJoin(exams, eq(exams.id, examRules.examId))
      .innerJoin(tracks, eq(tracks.id, exams.trackId))
      .where(eq(tracks.slug, SLUG));
    expect(rule?.count).toBe(2);
  });

  it('ignores edited files until the revision is raised', async () => {
    writeLesson('01-hello.md', 'Hello, revised');
    expect(await syncContent(contentDir)).toEqual({ add: [], update: [] });
    expect((await lessonRows())[0]?.title).toBe('Hello');
  });

  it('updates a revised track in place, keeping the ids learners have progress against', async () => {
    writeLesson('01-first-steps.md', 'First Steps');
    rmSync(join(level, 'lessons', '01-hello.md'));
    writeLesson('02-hello.md', 'Hello, revised');
    writeTrack(2);
    expect(await syncContent(contentDir)).toEqual({ add: [], update: [SLUG] });
    const rows = await lessonRows();
    expect(rows.map((row) => row.title)).toEqual(['First Steps', 'Hello, revised']);
    expect(rows[1]?.id).toBe(firstLessonId);
    expect(await syncContent(contentDir)).toEqual({ add: [], update: [] });
  });

  it('archives what a revision retires, and seeds the exams the track declares', async () => {
    rmSync(join(level, 'lessons', '01-first-steps.md'));
    writeQuestions(2);
    const final = ['exams:', '  - slug: probe-final', '    title: Probe Final', '    timeLimitMinutes: 30', '    rules:', '      - category: probe', '        count: 2'];
    writeTrack(3, [...final, 'retired:', '  lessons: [basic/first-steps]', `  questions: [${SLUG}-3]`]);
    expect(await syncContent(contentDir)).toEqual({ add: [], update: [SLUG] });

    const rows = (await lessonRows()).map((row) => [row.slug, row.status]).sort();
    expect(rows).toEqual([['first-steps', 'archived'], ['hello', 'published']]);
    const [retired] = await db.select({ status: questions.status }).from(questions).where(eq(questions.key, `${SLUG}-3`));
    expect(retired?.status).toBe('archived');

    const blueprint = await db
      .select({ courseId: exams.courseId, minutes: exams.timeLimitMinutes, categoryId: examRules.categoryId, difficulty: examRules.difficulty, count: examRules.count })
      .from(examRules)
      .innerJoin(exams, eq(exams.id, examRules.examId))
      .innerJoin(tracks, eq(tracks.id, exams.trackId))
      .where(and(eq(exams.slug, 'probe-final'), eq(tracks.slug, SLUG)));
    expect(blueprint).toHaveLength(1);
    expect(blueprint[0]).toMatchObject({ courseId: null, minutes: 30, difficulty: null, count: 2 });
    expect(blueprint[0]?.categoryId).toBeTruthy();
  });

  it('does not bring back a track that was deleted here', async () => {
    await db.delete(tracks).where(eq(tracks.slug, SLUG));
    writeTrack(4);
    expect(await syncContent(contentDir)).toEqual({ add: [], update: [] });
    expect(await lessonRows()).toEqual([]);
  });
});
