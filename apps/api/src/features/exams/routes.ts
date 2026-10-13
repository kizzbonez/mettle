import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { attemptQuestions, examAttempts, exams, questions } from '../../db/schema/assessment';
import { courses, tracks } from '../../db/schema/catalog';
import { conflict, notFound } from '../../lib/errors';
import { parse, uuidParam } from '../../lib/validate';
import { authenticated, me } from '../../plugins/auth';
import { ensureEnrolled } from '../catalog/enrollment';
import { DEADLINE_GRACE_MS, finalizeAttempt } from './finalize';
import { plannedQuestionCount } from './generate';
import { isValidSelection } from './grade';
import { ownedAttempt, presentAttempt } from './present';
import { startAttempt } from './start';

const answerParams = z.object({ id: z.uuid(), answerId: z.uuid() });
const answerBody = z.object({ selectedOptionIds: z.array(z.uuid()).max(10), flagged: z.boolean().optional() });

type AttemptRow = typeof examAttempts.$inferSelect;

async function publishedExam(examId: string) {
  const [row] = await db
    .select({ exam: exams, track: tracks, course: courses })
    .from(exams)
    .innerJoin(tracks, eq(tracks.id, exams.trackId))
    .leftJoin(courses, eq(courses.id, exams.courseId))
    .where(and(eq(exams.id, examId), eq(exams.status, 'published'), eq(tracks.status, 'published')))
    .limit(1);
  if (!row || (row.course && row.course.status !== 'published')) throw notFound('Exam');
  return row;
}

const isOverdue = (attempt: AttemptRow) => Date.now() > attempt.expiresAt.getTime() + DEADLINE_GRACE_MS;

/** Closes the attempt first if its time has run out, so every read sees a consistent state. */
async function settle(attemptId: string, userId: string): Promise<AttemptRow> {
  const { attempt } = await ownedAttempt(attemptId, userId);
  if (attempt.status === 'in_progress' && isOverdue(attempt)) await finalizeAttempt(attemptId);
  return attempt;
}

const summary = (a: AttemptRow) => ({
  id: a.id, status: a.status, startedAt: a.startedAt, submittedAt: a.submittedAt,
  scorePercent: a.scorePercent, passed: a.passed, correctCount: a.correctCount, totalCount: a.totalCount,
});

async function examOverview(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  const { exam, track, course } = await publishedExam(id);
  if (course) await ensureEnrolled(userId, course);
  const mine = and(eq(examAttempts.examId, id), eq(examAttempts.userId, userId));
  const [questionCount, attempts] = await Promise.all([
    plannedQuestionCount(exam, db),
    db.select().from(examAttempts).where(mine).orderBy(desc(examAttempts.startedAt)).limit(20),
  ]);
  const live = attempts.find((a) => a.status === 'in_progress' && a.expiresAt > new Date());
  return {
    exam: {
      id: exam.id, title: exam.title, description: exam.description, mode: exam.mode, questionCount,
      timeLimitMinutes: exam.timeLimitMinutes, passPercent: exam.passPercent, maxAttempts: exam.maxAttempts,
    },
    track: { id: track.id, title: track.title },
    course: course ? { id: course.id, title: course.title, level: course.level } : null,
    liveAttemptId: live?.id ?? null,
    attempts: attempts.filter((a) => a.status !== 'in_progress').map(summary),
  };
}

async function beginAttempt(request: FastifyRequest, reply: FastifyReply) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  const { exam, course } = await publishedExam(id);
  if (course) await ensureEnrolled(userId, course);
  return reply.code(201).send({ attemptId: await startAttempt(userId, exam) });
}

async function readAttempt(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  await settle(id, me(request).id);
  return presentAttempt(id, me(request).id);
}

async function saveAnswer(request: FastifyRequest) {
  const params = parse(answerParams, request.params);
  const input = parse(answerBody, request.body);
  const attempt = await settle(params.id, me(request).id);
  if (attempt.status !== 'in_progress' || isOverdue(attempt)) throw conflict('This attempt is closed.', 'attempt_closed');
  const [dealt] = await db
    .select({ item: attemptQuestions, type: questions.type })
    .from(attemptQuestions)
    .innerJoin(questions, eq(questions.id, attemptQuestions.questionId))
    .where(and(eq(attemptQuestions.id, params.answerId), eq(attemptQuestions.attemptId, params.id)))
    .limit(1);
  if (!dealt) throw notFound('Question');
  if (!isValidSelection(dealt.type, dealt.item.optionOrder, input.selectedOptionIds)) {
    throw conflict('That answer does not belong to this question.', 'invalid_selection');
  }
  await db
    .update(attemptQuestions)
    .set({ selectedOptionIds: input.selectedOptionIds, flagged: input.flagged ?? dealt.item.flagged, answeredAt: new Date() })
    .where(eq(attemptQuestions.id, params.answerId));
  return { ok: true };
}

async function submitAttempt(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  await ownedAttempt(id, userId);
  await finalizeAttempt(id);
  return presentAttempt(id, userId);
}

export async function examRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticated);
  app.get('/exams/:id', examOverview);
  app.post('/exams/:id/attempts', { config: { rateLimit: { max: 30, timeWindow: '10 minutes' } } }, beginAttempt);
  app.get('/attempts/:id', readAttempt);
  app.put('/attempts/:id/answers/:answerId', saveAnswer);
  app.post('/attempts/:id/submit', submitAttempt);
}
