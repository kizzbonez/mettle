import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerLearner, TestClient } from '../../test/client';
import { buildApp } from '../app';
import { db, pool } from '../db/client';
import { examAttempts, questionOptions } from '../db/schema/assessment';
import { labs } from '../db/schema/labs';

let app: FastifyInstance;
let courseId = '';
let lessonIds: string[] = [];
let examId = '';
let labId = '';

beforeAll(async () => {
  app = await buildApp();
  const { client } = await registerLearner(app);
  const catalog = await client.get('/catalog');
  courseId = catalog.body.tracks[0].courses[0].id;
  const course = await client.get(`/courses/${courseId}`);
  lessonIds = course.body.lessons.map((lesson: { id: string }) => lesson.id);
  examId = course.body.exams[0].id;
  labId = course.body.labs[0].id;
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

async function correctOptionIds(): Promise<Set<string>> {
  const rows = await db.select({ id: questionOptions.id }).from(questionOptions).where(eq(questionOptions.isCorrect, true));
  return new Set(rows.map((row) => row.id));
}

async function waitForSubmission(client: TestClient, id: string) {
  for (let i = 0; i < 120; i += 1) {
    const { body } = await client.get(`/submissions/${id}`);
    if (!['queued', 'running'].includes(body.status)) return body;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('submission did not finish');
}

describe('catalog', () => {
  it('is public for the landing page, without learner data', async () => {
    const response = await new TestClient(app).get('/public/tracks');
    expect(response.status).toBe(200);
    const course = response.body.tracks[0].courses[0];
    expect(course).toMatchObject({ level: 'basic', lessonCount: 3, labCount: 1, examCount: 1 });
    expect(course.enrolled).toBeUndefined();
  });

  it('requires an account for everything else', async () => {
    const visitor = new TestClient(app);
    for (const url of ['/catalog', `/courses/${courseId}`, `/lessons/${lessonIds[0]}`, `/exams/${examId}`, `/labs/${labId}`, '/me/dashboard']) {
      expect((await visitor.get(url)).status, url).toBe(401);
    }
  });
});

describe('lessons and progress', () => {
  it('enrolls on first visit and tracks completed lessons', async () => {
    const { client } = await registerLearner(app);
    const lesson = await client.get(`/lessons/${lessonIds[0]}`);
    expect(lesson.body).toMatchObject({ done: false, position: 1, count: 3, previous: null });
    expect(lesson.body.lesson.bodyMd).toContain('## Outline');

    await client.post(`/lessons/${lessonIds[0]}/complete`);
    await client.post(`/lessons/${lessonIds[0]}/complete`); // idempotent
    const course = await client.get(`/courses/${courseId}`);
    expect(course.body.enrolled).toBe(true);
    expect(course.body.progress).toEqual({ total: 5, done: 1, percent: 20 });
    expect(course.body.next).toMatchObject({ kind: 'lesson', id: lessonIds[1] });
  });
});

describe('exam engine', () => {
  it('deals a paper without revealing answers, and deals it only once', async () => {
    const { client } = await registerLearner(app);
    const started = await client.post(`/exams/${examId}/attempts`);
    expect(started.status).toBe(201);
    const again = await client.post(`/exams/${examId}/attempts`);
    expect(again.body.attemptId).toBe(started.body.attemptId);

    const paper = await client.get(`/attempts/${started.body.attemptId}`);
    expect(paper.body.status).toBe('in_progress');
    expect(paper.body.questions).toHaveLength(5);
    expect(paper.body.result).toBeNull();
    const serialized = JSON.stringify(paper.body);
    expect(serialized).not.toContain('isCorrect');
    expect(serialized).not.toContain('explanationMd');
  });

  it('grades a perfect paper, then shows the answers and explanations', async () => {
    const { client } = await registerLearner(app);
    const { attemptId } = (await client.post(`/exams/${examId}/attempts`)).body;
    const paper = (await client.get(`/attempts/${attemptId}`)).body;
    const correct = await correctOptionIds();
    for (const question of paper.questions) {
      const selectedOptionIds = question.options.map((o: { id: string }) => o.id).filter((id: string) => correct.has(id));
      const saved = await client.put(`/attempts/${attemptId}/answers/${question.id}`, { selectedOptionIds });
      expect(saved.status).toBe(200);
    }
    const result = await client.post(`/attempts/${attemptId}/submit`);
    expect(result.body.status).toBe('submitted');
    expect(result.body.result).toEqual({ correct: 5, total: 5, percent: 100, passed: true });
    expect(result.body.questions.every((q: { isCorrect: boolean; explanationMd: string }) => q.isCorrect && q.explanationMd.length > 20)).toBe(true);
    expect((await client.put(`/attempts/${attemptId}/answers/${paper.questions[0].id}`, { selectedOptionIds: [] })).status).toBe(409);
  });

  it('fails a blank paper and rejects options from another question', async () => {
    const { client } = await registerLearner(app);
    const { attemptId } = (await client.post(`/exams/${examId}/attempts`)).body;
    const paper = (await client.get(`/attempts/${attemptId}`)).body;
    const foreign = paper.questions[1].options[0].id;
    const bad = await client.put(`/attempts/${attemptId}/answers/${paper.questions[0].id}`, { selectedOptionIds: [foreign] });
    expect(bad.body.error.code).toBe('invalid_selection');
    const result = await client.post(`/attempts/${attemptId}/submit`);
    expect(result.body.result).toMatchObject({ correct: 0, percent: 0, passed: false });
  });

  it('hides one learner\'s attempt from another', async () => {
    const owner = await registerLearner(app);
    const other = await registerLearner(app);
    const { attemptId } = (await owner.client.post(`/exams/${examId}/attempts`)).body;
    expect((await other.client.get(`/attempts/${attemptId}`)).status).toBe(404);
    expect((await other.client.post(`/attempts/${attemptId}/submit`)).status).toBe(404);
  });

  it('grades an attempt whose time ran out with whatever was saved', async () => {
    const { client } = await registerLearner(app);
    const { attemptId } = (await client.post(`/exams/${examId}/attempts`)).body;
    await db.update(examAttempts).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(examAttempts.id, attemptId));
    const closed = await client.get(`/attempts/${attemptId}`);
    expect(closed.body.status).toBe('expired');
    expect(closed.body.result.passed).toBe(false);
    const next = await client.post(`/exams/${examId}/attempts`);
    expect(next.body.attemptId).not.toBe(attemptId);
  });
});

describe('lab engine', () => {
  it('never sends the reference solution or the hidden tests to the browser', async () => {
    const { client } = await registerLearner(app);
    const lab = await client.get(`/labs/${labId}`);
    const [row] = await db.select().from(labs).where(eq(labs.id, labId));
    expect(JSON.stringify(lab.body)).not.toContain(row?.solutionCode.slice(40, 120));
    expect(lab.body.lab.solutionCode).toBeUndefined();
    const tests = lab.body.lab.tests as { hidden: boolean; code: string | null }[];
    expect(tests.map((t) => t.hidden)).toEqual([false, true, true]);
    expect(tests.map((t) => t.code === null)).toEqual([false, true, true]);
    expect(lab.body.code).toBe(lab.body.lab.starterCode);
  });

  it('runs only the visible test on Run, and all tests on Submit', async () => {
    const { client } = await registerLearner(app);
    const starter = (await client.get(`/labs/${labId}`)).body.lab.starterCode;
    const run = await client.post(`/labs/${labId}/submissions`, { code: starter, kind: 'run' });
    expect(run.status).toBe(202);
    const ran = await waitForSubmission(client, run.body.submissionId);
    expect(ran.status).toBe('failed');
    expect(ran.results).toHaveLength(1);
    expect(ran.results[0].stderr).toContain('expected:');

    const submit = await client.post(`/labs/${labId}/submissions`, { code: starter, kind: 'submit' });
    const submitted = await waitForSubmission(client, submit.body.submissionId);
    expect(submitted.results).toHaveLength(3);
    const hidden = submitted.results.filter((r: { hidden: boolean }) => r.hidden);
    expect(hidden.every((r: { stdout: null; stderr: null; message: string }) => r.stdout === null && r.stderr === null && r.message)).toBe(true);
    expect(JSON.stringify(hidden)).not.toContain('172.16.0.20');
  });

  it('passes the reference solution and completes the course', async () => {
    const { client } = await registerLearner(app);
    for (const id of lessonIds) await client.post(`/lessons/${id}/complete`);
    const { attemptId } = (await client.post(`/exams/${examId}/attempts`)).body;
    const paper = (await client.get(`/attempts/${attemptId}`)).body;
    const correct = await correctOptionIds();
    for (const question of paper.questions) {
      const selectedOptionIds = question.options.map((o: { id: string }) => o.id).filter((id: string) => correct.has(id));
      await client.put(`/attempts/${attemptId}/answers/${question.id}`, { selectedOptionIds });
    }
    await client.post(`/attempts/${attemptId}/submit`);

    const [row] = await db.select().from(labs).where(eq(labs.id, labId));
    const submit = await client.post(`/labs/${labId}/submissions`, { code: row?.solutionCode, kind: 'submit' });
    const done = await waitForSubmission(client, submit.body.submissionId);
    expect(done).toMatchObject({ status: 'passed', passedCount: 3, totalCount: 3 });

    const course = (await client.get(`/courses/${courseId}`)).body;
    expect(course).toMatchObject({ completed: true, next: null, progress: { total: 5, done: 5, percent: 100 } });
    const dashboard = (await client.get('/me/dashboard')).body;
    expect(dashboard.stats).toMatchObject({ coursesCompleted: 1, lessonsCompleted: 3, examsPassed: 1, labsPassed: 1, averageScore: 100 });
    expect(dashboard.activity.map((a: { kind: string }) => a.kind)).toContain('course_completed');
    const tree = (await client.get('/me/skill-tree')).body;
    expect(tree.tracks[0].levels[0]).toMatchObject({ state: 'completed', percent: 100 });
  });

  it('keeps a draft and refuses a second job while one is running', async () => {
    const { client } = await registerLearner(app);
    await client.put(`/labs/${labId}/draft`, { code: 'echo draft' });
    expect((await client.get(`/labs/${labId}`)).body.code).toBe('echo draft');
    const first = await client.post(`/labs/${labId}/submissions`, { code: 'sleep 1', kind: 'run' });
    const second = await client.post(`/labs/${labId}/submissions`, { code: 'sleep 1', kind: 'run' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('submission_in_progress');
    await waitForSubmission(client, first.body.submissionId);
    expect((await client.get(`/labs/${labId}/submissions`)).body.submissions).toHaveLength(1);
  });
});
