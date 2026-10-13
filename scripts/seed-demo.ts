// Fills a development database with believable activity, so dashboards and
// tables have something to show: about fifty learners who joined over the last
// thirty days, with enrollments, exam attempts and lab submissions.
//
//   npm run seed:demo            add the demo learners
//   npm run seed:demo -- --clear remove them again (their data goes with them)
//
// Demo accounts use the address domain below and a password hash nobody knows,
// so none of them can sign in. Run against the dev services only.
import { randomBytes } from 'node:crypto';
import { devEnv } from './dev-env.mjs';

Object.assign(process.env, devEnv());
const { and, eq, like } = await import('drizzle-orm');
const { db, pool } = await import('../apps/api/src/db/client');
const { users } = await import('../apps/api/src/db/schema/identity');
const { courses, lessons, tracks } = await import('../apps/api/src/db/schema/catalog');
const { examAttempts, exams } = await import('../apps/api/src/db/schema/assessment');
const { labs, labSubmissions } = await import('../apps/api/src/db/schema/labs');
const { activityEvents, enrollments, lessonProgress } = await import('../apps/api/src/db/schema/progress');
const { hashPassword } = await import('../apps/api/src/lib/passwords');

const DOMAIN = '@demo.mettle.test';
const DAY = 24 * 60 * 60_000;
const FIRST = ['Maya', 'Arjun', 'Lucía', 'Kenji', 'Amara', 'Tomás', 'Ingrid', 'Rashid', 'Chloe', 'Dmitri', 'Nia', 'Mateo', 'Sana', 'Jonas', 'Thandi', 'Elif', 'Bao', 'Freya', 'Kwame', 'Isla', 'Rafael', 'Mei', 'Oskar', 'Zainab'];
const LAST = ['Reyes', 'Nakamura', 'Okafor', 'Lindqvist', 'Haddad', 'Castillo', 'Nguyen', 'Mbeki', 'Petrov', 'Santos', 'Yilmaz', 'Brennan'];
const PASS_ODDS = { basic: 0.72, medium: 0.58, advanced: 0.44, professional: 0.33 } as const;

// A small seeded generator, so every run produces the same crowd.
let seed = 20261013;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const chance = (odds: number) => random() < odds;
const between = (low: number, high: number) => low + Math.floor(random() * (high - low + 1));
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
// A moment after `start`, at most `maxDays` later and never in the future.
const after = (start: Date, maxDays: number) => {
  const room = Math.max(0, Date.now() - 60_000 - start.getTime());
  return new Date(start.getTime() + random() * Math.min(maxDays * DAY, room));
};
// Someone whose story has reached today has not done the rest of it yet.
const caughtUp = (cursor: Date) => Date.now() - cursor.getTime() < 0.75 * DAY;

if (process.argv.includes('--clear')) {
  const removed = await db.delete(users).where(like(users.email, `%${DOMAIN}`)).returning({ id: users.id });
  console.log(`Removed ${removed.length} demo learners.`);
  await pool.end();
  process.exit(0);
}

const catalog = await db
  .select({ course: courses, track: tracks.slug })
  .from(courses)
  .innerJoin(tracks, eq(tracks.id, courses.trackId))
  .where(and(eq(courses.status, 'published'), eq(tracks.status, 'published')));
if (catalog.length === 0) throw new Error('No published courses. Start the API once so it loads the curriculum.');
const allLessons = await db.select().from(lessons);
const allExams = await db.select().from(exams);
const allLabs = await db.select().from(labs);

const unusable = await hashPassword(randomBytes(24).toString('hex'));
const people = Array.from({ length: 52 }, (_, i) => {
  const first = FIRST[i % FIRST.length] as string;
  const last = LAST[(i * 5 + Math.floor(i / FIRST.length)) % LAST.length] as string;
  // Slightly more sign-ups recently than a month ago.
  const createdAt = new Date(Date.now() - (0.03 + 0.97 * random() ** 1.15) * 29 * DAY);
  return {
    email: `${first}.${last}.${i}`.toLowerCase().normalize('NFD').replace(/[^a-z0-9.]/g, '') + DOMAIN,
    displayName: `${first} ${last}`,
    passwordHash: unusable,
    createdAt,
    lastLoginAt: after(createdAt, 20),
    lastSeenAt: chance(0.68) ? new Date(Date.now() - random() * 6 * DAY) : after(createdAt, 10),
  };
});
const created = await db.insert(users).values(people).onConflictDoNothing({ target: users.email }).returning();
if (created.length === 0) {
  console.log('Demo learners are already present. Use --clear first to start again.');
  await pool.end();
  process.exit(0);
}

const tally = { enrollments: 0, attempts: 0, submissions: 0 };
for (const user of created) {
  // Most people start at Basic; a few go further in the same track.
  const track = pick(['rust', 'rust', 'ai', 'ai', 'cyber-security']);
  const inTrack = catalog.filter((item) => item.track === track).sort((a, b) => a.course.sortOrder - b.course.sortOrder);
  const depth = Math.min(inTrack.length, chance(0.55) ? 1 : chance(0.6) ? 2 : between(3, 4));
  let cursor = user.createdAt;

  for (const { course } of inTrack.slice(0, depth)) {
    const enrolledAt = after(cursor, 1);
    const odds = PASS_ODDS[course.level];
    const events: { kind: string; title: string; href: string; createdAt: Date; meta?: Record<string, unknown> }[] = [
      { kind: 'enrolled', title: course.title, href: `/courses/${course.id}`, createdAt: enrolledAt },
    ];
    cursor = enrolledAt;

    const courseLessons = allLessons.filter((lesson) => lesson.courseId === course.id).sort((a, b) => a.sortOrder - b.sortOrder);
    const read = courseLessons.slice(0, chance(0.75) ? courseLessons.length : between(0, 2));
    let lessonsRead = 0;
    for (const lesson of read) {
      if (caughtUp(cursor)) break;
      lessonsRead += 1;
      cursor = after(cursor, 1);
      await db.insert(lessonProgress).values({ userId: user.id, lessonId: lesson.id, completedAt: cursor });
      events.push({ kind: 'lesson_completed', title: lesson.title, href: `/lessons/${lesson.id}`, createdAt: cursor });
    }

    let examPassed = false;
    const exam = allExams.find((item) => item.courseId === course.id);
    if (exam && lessonsRead > 0 && chance(0.85)) {
      for (let attempt = 0; attempt < between(1, 3) && !examPassed && !caughtUp(cursor); attempt += 1) {
        cursor = after(cursor, 1);
        examPassed = chance(odds + attempt * 0.12);
        const correct = examPassed ? between(4, 5) : between(1, 3);
        await db.insert(examAttempts).values({
          examId: exam.id, userId: user.id, status: 'submitted', startedAt: new Date(cursor.getTime() - between(3, 9) * 60_000),
          expiresAt: new Date(cursor.getTime() + 60_000), submittedAt: cursor, totalCount: 5, correctCount: correct, scorePercent: correct * 20, passed: examPassed,
        });
        events.push({ kind: examPassed ? 'exam_passed' : 'exam_failed', title: exam.title, href: `/exams/${exam.id}`, createdAt: cursor, meta: { score: correct * 20 } });
        tally.attempts += 1;
      }
    }

    let labPassed = false;
    const lab = allLabs.find((item) => item.courseId === course.id);
    if (lab && examPassed && chance(0.8)) {
      for (let attempt = 0; attempt < between(1, 4) && !labPassed && !caughtUp(cursor); attempt += 1) {
        cursor = after(cursor, 1);
        labPassed = chance(odds * 0.75 + attempt * 0.15);
        const row = { labId: lab.id, userId: user.id, code: '// demo data', totalCount: 3, durationMs: between(700, 2600), createdAt: cursor, finishedAt: cursor };
        if (chance(0.7)) await db.insert(labSubmissions).values({ ...row, kind: 'run', status: 'failed', passedCount: 0, totalCount: 1 });
        await db.insert(labSubmissions).values({ ...row, kind: 'submit', status: labPassed ? 'passed' : 'failed', passedCount: labPassed ? 3 : between(0, 2) });
        tally.submissions += 1;
      }
      if (labPassed) events.push({ kind: 'lab_passed', title: lab.title, href: `/labs/${lab.id}`, createdAt: cursor });
    }

    const completed = lessonsRead === courseLessons.length && examPassed && labPassed;
    if (completed) events.push({ kind: 'course_completed', title: course.title, href: `/courses/${course.id}`, createdAt: cursor });
    await db.insert(enrollments).values({ userId: user.id, courseId: course.id, enrolledAt, completedAt: completed ? cursor : null });
    await db.insert(activityEvents).values(events.map((event) => ({ userId: user.id, ...event, meta: event.meta ?? {} })));
    tally.enrollments += 1;
    if (!completed) break;
  }
}

console.log(`Added ${created.length} demo learners: ${tally.enrollments} enrollments, ${tally.attempts} exam attempts, ${tally.submissions} lab submissions.`);
await pool.end();
