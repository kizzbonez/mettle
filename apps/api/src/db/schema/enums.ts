import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['learner', 'instructor', 'admin']);
export const userStatus = pgEnum('user_status', ['active', 'banned']);
export const tokenPurpose = pgEnum('token_purpose', ['password_reset']);
export const difficulty = pgEnum('difficulty', ['basic', 'medium', 'advanced', 'professional']);
export const publishStatus = pgEnum('publish_status', ['draft', 'published', 'archived']);
export const questionType = pgEnum('question_type', ['single', 'multiple', 'true_false']);
export const examMode = pgEnum('exam_mode', ['fixed', 'dynamic']);
export const attemptStatus = pgEnum('attempt_status', ['in_progress', 'submitted', 'expired']);
export const labLanguage = pgEnum('lab_language', ['rust', 'python', 'bash', 'cpp', 'csharp', 'yaml']);
export const submissionKind = pgEnum('submission_kind', ['run', 'submit']);
export const submissionStatus = pgEnum('submission_status', [
  'queued',
  'running',
  'passed',
  'failed',
  'compile_error',
  'timeout',
  'error',
]);
export const emailStatus = pgEnum('email_status', ['sent', 'failed']);
