import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerLearner, type TestClient } from '../../../../test/client';
import { signInStaff } from '../../../../test/staff';
import { buildApp } from '../../../app';
import { pool } from '../../../db/client';

let app: FastifyInstance;
let staff: TestClient;
let learner: TestClient;
let trackId = '';
let courseId = '';
const tag = `t${Date.now()}`;

beforeAll(async () => {
  app = await buildApp();
  staff = (await signInStaff(app, 'instructor')).client;
  learner = (await registerLearner(app)).client;
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

const option = (bodyMd: string, isCorrect = false) => ({ bodyMd, isCorrect });

function question(overrides: Record<string, unknown> = {}) {
  return {
    trackId, categoryId: null, difficulty: 'basic', type: 'single', promptMd: 'What does `2 + 2` evaluate to?',
    explanationMd: 'Integer addition.', tags: [tag], status: 'published',
    options: [option('3'), option('4', true), option('22'), option('5')],
    ...overrides,
  };
}

describe('a new subject, end to end', () => {
  it('creates a track and a course without touching code', async () => {
    const track = await staff.post('/admin/tracks', { slug: `go-${tag}`, title: 'Go Development', icon: 'Boxes', status: 'draft' });
    expect(track.status).toBe(201);
    trackId = track.body.track.id;
    const course = await staff.post('/admin/courses', { trackId, slug: 'basic', level: 'basic', title: 'Go Foundations', status: 'published' });
    courseId = course.body.course.id;
    expect((await staff.post('/admin/tracks', { slug: `go-${tag}`, title: 'Duplicate' })).status).toBe(409);
    expect((await staff.post('/admin/tracks', { slug: 'Not A Slug', title: 'Bad' })).status).toBe(400);
  });

  it('hides a draft track from learners until it is published', async () => {
    const hidden = (await learner.get('/catalog')).body.tracks.map((t: { id: string }) => t.id);
    expect(hidden).not.toContain(trackId);
    expect((await learner.get(`/courses/${courseId}`)).status).toBe(404);
    await staff.patch(`/admin/tracks/${trackId}`, { status: 'published' });
    const visible = (await learner.get('/catalog')).body.tracks.map((t: { id: string }) => t.id);
    expect(visible).toContain(trackId);
  });

  it('adds a lesson a learner can then read', async () => {
    const created = await staff.post('/admin/lessons', { courseId, slug: 'hello', title: 'Hello, Go', bodyMd: '## Outline\n\nPackages and `main`.', status: 'published' });
    expect(created.status).toBe(201);
    const read = await learner.get(`/lessons/${created.body.lesson.id}`);
    expect(read.body.lesson.title).toBe('Hello, Go');
    const list = await staff.get(`/admin/lessons?courseId=${courseId}`);
    expect(list.body.total).toBe(1);
  });

  it('leaves alone the fields a partial update did not send', async () => {
    const details = { tagline: 'Small, fast services.', description: 'From packages to production.', icon: 'Rocket', sortOrder: 7 };
    await staff.patch(`/admin/tracks/${trackId}`, details);
    const { track } = (await staff.patch(`/admin/tracks/${trackId}`, { title: 'Go Engineering' })).body;
    expect(track).toMatchObject({ ...details, title: 'Go Engineering', status: 'published' });

    const extras = { summary: 'Start here.', outcomes: ['Write a package'], sortOrder: 3 };
    await staff.patch(`/admin/courses/${courseId}`, extras);
    const { course } = (await staff.patch(`/admin/courses/${courseId}`, { title: 'Go Basics' })).body;
    expect(course).toMatchObject({ ...extras, title: 'Go Basics', status: 'published' });

    const lessonId = (await staff.get(`/admin/lessons?courseId=${courseId}`)).body.items[0].id;
    const { lesson } = (await staff.patch(`/admin/lessons/${lessonId}`, { estMinutes: 25 })).body;
    expect(lesson).toMatchObject({ estMinutes: 25, status: 'published', bodyMd: '## Outline\n\nPackages and `main`.' });
  });
});

describe('question bank', () => {
  it('rejects a question whose options do not fit its type', async () => {
    const none = await staff.post('/admin/questions', question({ options: [option('a'), option('b')] }));
    expect(none.status).toBe(400);
    expect(none.body.error.details.fields.options).toMatch(/exactly one correct/);
    const single = await staff.post('/admin/questions', question({ type: 'multiple' }));
    expect(single.body.error.details.fields.options).toMatch(/at least two correct/);
  });

  it('keeps option ids when a question is edited', async () => {
    const { id } = (await staff.post('/admin/questions', question())).body;
    const before = (await staff.get(`/admin/questions/${id}`)).body.question;
    const edited = before.options.map((o: { id: string; bodyMd: string; isCorrect: boolean }) => ({ id: o.id, bodyMd: `${o.bodyMd} (edited)`, isCorrect: o.isCorrect }));
    edited.pop();
    edited.push(option('a brand new option'));
    expect((await staff.put(`/admin/questions/${id}`, question({ options: edited }))).status).toBe(200);
    const after = (await staff.get(`/admin/questions/${id}`)).body.question;
    expect(after.options.slice(0, 3).map((o: { id: string }) => o.id)).toEqual(before.options.slice(0, 3).map((o: { id: string }) => o.id));
    expect(after.options[3].id).not.toBe(before.options[3].id);
    expect(after.options[0].bodyMd).toMatch(/edited/);
  });

  it('imports in bulk, all or nothing, and filters on the server', async () => {
    const batch = Array.from({ length: 40 }, (_, i) => question({ promptMd: `Bulk question number ${i} for ${tag}`, difficulty: i % 2 ? 'basic' : 'medium' }));
    expect((await staff.post('/admin/questions/import', { questions: batch })).body).toEqual({ created: 40 });
    const broken = [...batch.slice(0, 3), question({ options: [option('only one', true)] })];
    expect((await staff.post('/admin/questions/import', { questions: broken })).status).toBe(400);

    const medium = await staff.get(`/admin/questions?tag=${tag}&difficulty=medium&pageSize=10`);
    expect(medium.body).toMatchObject({ total: 20, pageCount: 2 });
    const search = await staff.get(`/admin/questions?q=${encodeURIComponent(`number 7 for ${tag}`)}`);
    expect(search.body.total).toBe(1);
  });
});

describe('exams', () => {
  it('builds a dynamic exam from rules and reports how large each pool is', async () => {
    const created = await staff.post('/admin/exams', {
      trackId, courseId, slug: 'mixed', title: 'Mixed Paper', mode: 'dynamic', timeLimitMinutes: 15, passPercent: 60, status: 'published',
      rules: [{ trackId, difficulty: 'basic', count: 4 }, { trackId, difficulty: 'medium', count: 3 }],
    });
    expect(created.status).toBe(201);
    const exam = (await staff.get(`/admin/exams/${created.body.id}`)).body;
    expect(exam.rules.map((r: { available: number }) => r.available)).toEqual([21, 20]);

    const first = (await learner.post(`/exams/${created.body.id}/attempts`)).body.attemptId;
    const paper = (await learner.get(`/attempts/${first}`)).body;
    expect(paper.questions).toHaveLength(7);
    expect(new Set(paper.questions.map((q: { promptMd: string }) => q.promptMd)).size).toBe(7);
  });

  it('deals different papers to different learners from the same blueprint', async () => {
    const { exams } = (await learner.get(`/courses/${courseId}`)).body;
    const papers: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const { client } = await registerLearner(app);
      const { attemptId } = (await client.post(`/exams/${exams[0].id}/attempts`)).body;
      const paper = (await client.get(`/attempts/${attemptId}`)).body;
      papers.push(paper.questions.map((q: { promptMd: string }) => q.promptMd).join('|'));
    }
    expect(new Set(papers).size).toBeGreaterThan(1);
  });
});

describe('labs', () => {
  const lab = () => ({
    courseId, slug: 'sum', title: 'Sum a List', language: 'python', status: 'published', timeLimitMs: 3000,
    starterCode: 'def total(xs):\n    raise NotImplementedError\n',
    solutionCode: 'def total(xs):\n    return sum(xs)\n',
    tests: [
      { name: 'adds small numbers', code: 'assert total([1, 2, 3]) == 6, "1 + 2 + 3"', hidden: false },
      { name: 'handles an empty list', code: 'assert total([]) == 0, "empty list"', hidden: true },
    ],
  });

  it('creates a lab and proves it sound in the sandbox', async () => {
    const created = await staff.post('/admin/labs', lab());
    expect(created.status).toBe(201);
    const verdict = (await staff.post(`/admin/labs/${created.body.id}/verify`)).body;
    expect(verdict.sound).toBe(true);
    expect(verdict.solution.status).toBe('passed');
    expect(verdict.starter.status).toBe('failed');
  });

  it('reports a lab whose reference solution fails its own tests', async () => {
    const broken = await staff.post('/admin/labs', { ...lab(), slug: 'sum-broken', solutionCode: 'def total(xs):\n    return 0\n' });
    const verdict = (await staff.post(`/admin/labs/${broken.body.id}/verify`)).body;
    expect(verdict.sound).toBe(false);
    expect(verdict.solution.tests[0].stderr).toContain('1 + 2 + 3');
  });

  const otherLanguages = [
    {
      language: 'cpp', slug: 'sum-cpp',
      starterCode: '#include <vector>\n\nint total(const std::vector<int>& xs) { return 0; }\n',
      solutionCode: '#include <numeric>\n#include <vector>\n\nint total(const std::vector<int>& xs) { return std::accumulate(xs.begin(), xs.end(), 0); }\n',
      test: 'CHECK_EQ(total({1, 2, 3}), 6, "1 + 2 + 3");',
    },
    {
      language: 'csharp', slug: 'sum-csharp', memoryMb: 512,
      starterCode: 'public static class Sums\n{\n    public static int Total(IEnumerable<int> xs) => 0;\n}\n',
      solutionCode: 'public static class Sums\n{\n    public static int Total(IEnumerable<int> xs) => xs.Sum();\n}\n',
      test: 'Check.Equal(Sums.Total(new[] { 1, 2, 3 }), 6, "1 + 2 + 3");',
    },
    {
      language: 'yaml', slug: 'sum-yaml',
      starterCode: 'numbers: []\n',
      solutionCode: 'numbers:\n  - 1\n  - 2\n  - 3\n',
      test: 'assert sum(doc["numbers"]) == 6, "the numbers add up to six"',
    },
  ];

  it.each(otherLanguages)('creates and verifies a $language lab', async ({ test, ...fields }) => {
    const created = await staff.post('/admin/labs', { ...lab(), ...fields, tests: [{ name: 'adds three numbers', code: test, hidden: false }] });
    expect(created.status).toBe(201);
    const verdict = (await staff.post(`/admin/labs/${created.body.id}/verify`)).body;
    expect(verdict.solution.status).toBe('passed');
    expect(verdict.starter.status).toBe('failed');
    expect(verdict.sound).toBe(true);
  });

  describe('practice labs', () => {
    let lessonId = '';
    let practiceId = '';

    it('attaches a lab to a lesson, and only to a lesson of the same course', async () => {
      lessonId = (await staff.get(`/admin/lessons?courseId=${courseId}`)).body.items[0].id;
      const created = await staff.post('/admin/labs', { ...lab(), slug: 'practice-hello', title: 'Try Hello', lessonId });
      expect(created.status).toBe(201);
      practiceId = created.body.id;
      const elsewhere = (await staff.get('/admin/courses')).body.courses.find((c: { id: string }) => c.id !== courseId);
      const foreignLesson = (await staff.get(`/admin/lessons?courseId=${elsewhere.id}`)).body.items[0].id;
      const refused = await staff.post('/admin/labs', { ...lab(), slug: 'practice-foreign', lessonId: foreignLesson });
      expect(refused.status).toBe(400);
      expect(refused.body.error.details.fields.lessonId).toMatch(/lesson of this course/);
    });

    it('lists it under its lesson, not among the labs of the level', async () => {
      const course = (await learner.get(`/courses/${courseId}`)).body;
      expect(course.lessons[0].practice).toMatchObject({ id: practiceId, title: 'Try Hello', done: false });
      expect(course.labs.map((item: { id: string }) => item.id)).not.toContain(practiceId);
      expect(course.labs.length).toBeGreaterThan(0);
    });

    it('offers it from the lesson, and makes it the next step once the lesson is read', async () => {
      const { client } = await registerLearner(app);
      expect((await client.get(`/lessons/${lessonId}`)).body.practice).toMatchObject({ id: practiceId, done: false });
      expect((await client.get(`/courses/${courseId}`)).body.next).toMatchObject({ kind: 'lesson', id: lessonId });
      await client.post(`/lessons/${lessonId}/complete`);
      expect((await client.get(`/courses/${courseId}`)).body.next).toMatchObject({ kind: 'lab', id: practiceId });
    });

    it('tells the workspace which lesson it belongs to', async () => {
      const detail = (await learner.get(`/labs/${practiceId}`)).body;
      expect(detail.lesson).toMatchObject({ id: lessonId, title: 'Hello, Go' });
      expect(detail.nextLesson).toBeNull();
      const levelLab = (await learner.get(`/courses/${courseId}`)).body.labs[0].id;
      expect((await learner.get(`/labs/${levelLab}`)).body.lesson).toBeNull();
    });
  });

  it('refuses a fixture path outside data/', async () => {
    const bad = await staff.post('/admin/labs', { ...lab(), slug: 'sum-evil', fixtures: [{ path: '../solution.py', content: 'x' }] });
    expect(bad.status).toBe(400);
  });
});
