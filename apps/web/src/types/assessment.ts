import type { Difficulty, LabLanguage, QuestionType, SubmissionStatus } from '@mettle/shared';

export interface AttemptSummary {
  id: string;
  status: 'submitted' | 'expired';
  startedAt: string;
  submittedAt: string | null;
  scorePercent: number | null;
  passed: boolean | null;
  correctCount: number | null;
  totalCount: number;
}

export interface ExamOverview {
  exam: {
    id: string;
    title: string;
    description: string;
    mode: 'fixed' | 'dynamic';
    questionCount: number;
    timeLimitMinutes: number;
    passPercent: number;
    maxAttempts: number | null;
  };
  track: { id: string; title: string };
  course: { id: string; title: string; level: Difficulty } | null;
  liveAttemptId: string | null;
  attempts: AttemptSummary[];
}

export interface AttemptOption {
  id: string;
  bodyMd: string;
  /** Present only once the attempt is closed. */
  isCorrect?: boolean;
}

export interface AttemptQuestion {
  id: string;
  type: QuestionType;
  promptMd: string;
  selectedOptionIds: string[];
  flagged: boolean;
  options: AttemptOption[];
  isCorrect?: boolean | null;
  explanationMd?: string;
}

export interface Attempt {
  id: string;
  status: 'in_progress' | 'submitted' | 'expired';
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  serverNow: string;
  exam: { id: string; title: string; courseId: string | null; passPercent: number; timeLimitMinutes: number };
  result: { correct: number; total: number; percent: number; passed: boolean } | null;
  questions: AttemptQuestion[];
}

export interface ExamHistoryRow {
  id: string;
  examId: string;
  examTitle: string;
  trackTitle: string;
  status: 'submitted' | 'expired';
  startedAt: string;
  submittedAt: string | null;
  scorePercent: number | null;
  correctCount: number | null;
  totalCount: number;
  passed: boolean | null;
}

export interface LabTest {
  id: string;
  name: string;
  hidden: boolean;
  /** Source of a visible test; null for hidden ones. */
  code: string | null;
}

export interface LabDetail {
  lab: {
    id: string;
    title: string;
    summary: string;
    scenarioMd: string;
    instructionsMd: string;
    language: LabLanguage;
    starterCode: string;
    estMinutes: number;
    timeLimitMs: number;
    memoryMb: number;
    fixtures: { path: string; content: string }[];
    tests: LabTest[];
  };
  course: { id: string; title: string; level: Difficulty };
  track: { id: string; title: string };
  code: string;
  passed: boolean;
}

export interface TestResult {
  name: string;
  hidden: boolean;
  passed: boolean;
  timedOut: boolean;
  durationMs: number;
  message: string | null;
  stdout: string | null;
  stderr: string | null;
}

export interface Submission {
  id: string;
  kind: 'run' | 'submit';
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  durationMs: number | null;
  compileOutput: string;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
  results: TestResult[];
}

export interface SubmissionRow {
  id: string;
  kind: 'run' | 'submit';
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  durationMs: number | null;
  createdAt: string;
}
