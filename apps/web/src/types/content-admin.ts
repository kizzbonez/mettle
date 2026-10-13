import type { Difficulty, LabLanguage, PublishStatus, QuestionType, RunnerStatus } from '@mettle/shared';

/** What the content management endpoints (/admin/tracks, /admin/lessons, ...) return. */

export interface AdminTrack {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  status: PublishStatus;
  sortOrder: number;
  courseCount: number;
  updatedAt: string;
}

export interface AdminCourse {
  id: string;
  trackId: string;
  trackTitle: string;
  slug: string;
  level: Difficulty;
  title: string;
  summary: string;
  outcomes: string[];
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
}

export interface LessonRow {
  id: string;
  title: string;
  slug: string;
  status: PublishStatus;
  estMinutes: number;
  sortOrder: number;
  updatedAt: string;
  courseId: string;
  courseTitle: string;
  level: Difficulty;
  trackTitle: string;
}

export interface AdminLesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  bodyMd: string;
  estMinutes: number;
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface QuestionRow {
  id: string;
  promptMd: string;
  type: QuestionType;
  difficulty: Difficulty;
  status: PublishStatus;
  tags: string[];
  updatedAt: string;
  trackTitle: string | null;
  categoryName: string | null;
}

export interface QuestionOption {
  id: string;
  bodyMd: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface AdminQuestion {
  id: string;
  trackId: string | null;
  categoryId: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  promptMd: string;
  explanationMd: string;
  tags: string[];
  status: PublishStatus;
  updatedAt: string;
  options: QuestionOption[];
}

export type ExamMode = 'fixed' | 'dynamic';

export interface AdminExam {
  id: string;
  trackId: string;
  courseId: string | null;
  slug: string;
  title: string;
  description: string;
  mode: ExamMode;
  timeLimitMinutes: number;
  passPercent: number;
  shuffleOptions: boolean;
  /** Null means unlimited attempts. */
  maxAttempts: number | null;
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
}

export interface ExamRow extends AdminExam {
  trackTitle: string;
  courseTitle: string | null;
}

export interface ExamRule {
  id: string;
  trackId: string | null;
  categoryId: string | null;
  difficulty: Difficulty | null;
  tag: string | null;
  count: number;
  /** Published questions this rule can draw from. */
  available: number;
}

export interface PinnedQuestion {
  id: string;
  promptMd: string;
  status: PublishStatus;
}

export interface ExamDetail {
  exam: AdminExam;
  rules: ExamRule[];
  questions: PinnedQuestion[];
}

export interface LabRow {
  id: string;
  title: string;
  slug: string;
  language: LabLanguage;
  status: PublishStatus;
  estMinutes: number;
  updatedAt: string;
  courseTitle: string;
  level: Difficulty;
  trackTitle: string;
}

export interface LabFixture {
  path: string;
  content: string;
}

export interface AdminLab {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  summary: string;
  scenarioMd: string;
  instructionsMd: string;
  language: LabLanguage;
  starterCode: string;
  solutionCode: string;
  fixtures: LabFixture[];
  timeLimitMs: number;
  memoryMb: number;
  estMinutes: number;
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
}

export interface LabTestCase {
  id: string;
  name: string;
  code: string;
  hidden: boolean;
}

export interface AdminLabDetail {
  lab: AdminLab;
  tests: LabTestCase[];
}

export interface VerifyTest {
  name: string;
  passed: boolean;
  durationMs: number;
  stderr: string;
  stdout: string;
  timedOut: boolean;
}

/** One sandbox run of a lab's tests against the solution or the starter. */
export interface VerifyRun {
  status: RunnerStatus;
  durationMs: number;
  compileOutput: string;
  /** Set when the sandbox itself failed. */
  error: string | null;
  tests: VerifyTest[];
}

export interface LabVerdict {
  /** The solution passes every test, and the starter builds but does not. */
  sound: boolean;
  solution: VerifyRun;
  starter: VerifyRun;
}
