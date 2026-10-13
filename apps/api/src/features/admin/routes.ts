import type { FastifyInstance } from 'fastify';
import { adminOnly, staffOnly } from '../../plugins/auth';
import { createExam, deleteExam, getExam, listExams, updateExam } from './content/exams';
import { createLab, deleteLab, getLab, listLabs, updateLab, verifyLab } from './content/labs';
import { createLesson, deleteLesson, getLesson, listLessons, updateLesson } from './content/lessons';
import {
  createCategory, createQuestion, deleteQuestion, getQuestion, importQuestions, listCategories, listQuestions, updateQuestion,
} from './content/questions';
import { createCourse, createTrack, deleteCourse, deleteTrack, listCourses, listTracks, updateCourse, updateTrack } from './content/tracks';
import { emailUsers, getSettings, listEmailLog, updateSettings } from './email';
import { adminMetrics } from './metrics';
import { banUser, createUser, getUser, listUsers, unbanUser, updateUser } from './users';

/** Content management: instructors and administrators. */
async function contentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', staffOnly);

  app.get('/admin/tracks', listTracks);
  app.post('/admin/tracks', createTrack);
  app.patch('/admin/tracks/:id', updateTrack);
  app.delete('/admin/tracks/:id', deleteTrack);

  app.get('/admin/courses', listCourses);
  app.post('/admin/courses', createCourse);
  app.patch('/admin/courses/:id', updateCourse);
  app.delete('/admin/courses/:id', deleteCourse);

  app.get('/admin/lessons', listLessons);
  app.get('/admin/lessons/:id', getLesson);
  app.post('/admin/lessons', createLesson);
  app.patch('/admin/lessons/:id', updateLesson);
  app.delete('/admin/lessons/:id', deleteLesson);

  app.get('/admin/categories', listCategories);
  app.post('/admin/categories', createCategory);
  app.get('/admin/questions', listQuestions);
  app.get('/admin/questions/:id', getQuestion);
  app.post('/admin/questions', createQuestion);
  app.post('/admin/questions/import', { bodyLimit: 8 * 1024 * 1024 }, importQuestions);
  app.put('/admin/questions/:id', updateQuestion);
  app.delete('/admin/questions/:id', deleteQuestion);

  app.get('/admin/exams', listExams);
  app.get('/admin/exams/:id', getExam);
  app.post('/admin/exams', createExam);
  app.put('/admin/exams/:id', updateExam);
  app.delete('/admin/exams/:id', deleteExam);

  app.get('/admin/labs', listLabs);
  app.get('/admin/labs/:id', getLab);
  app.post('/admin/labs', createLab);
  app.put('/admin/labs/:id', updateLab);
  app.delete('/admin/labs/:id', deleteLab);
  app.post('/admin/labs/:id/verify', { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } }, verifyLab);
}

/** People, email and settings: administrators only. */
async function peopleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', adminOnly);

  app.get('/admin/metrics', adminMetrics);
  app.get('/admin/users', listUsers);
  app.get('/admin/users/:id', getUser);
  app.post('/admin/users', createUser);
  app.patch('/admin/users/:id', updateUser);
  app.post('/admin/users/:id/ban', banUser);
  app.post('/admin/users/:id/unban', unbanUser);
  app.post('/admin/email', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, emailUsers);
  app.get('/admin/email-log', listEmailLog);
  app.get('/admin/settings', getSettings);
  app.put('/admin/settings', updateSettings);
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  await app.register(contentRoutes);
  await app.register(peopleRoutes);
}
