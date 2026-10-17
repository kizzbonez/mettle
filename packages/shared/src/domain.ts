/** Enumerations shared by the API, the runner and the web app. */

export const DIFFICULTIES = ['basic', 'medium', 'advanced', 'professional'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ROLES = ['learner', 'instructor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const LAB_LANGUAGES = ['rust', 'python', 'bash', 'cpp', 'csharp', 'yaml', 'typescript'] as const;
export type LabLanguage = (typeof LAB_LANGUAGES)[number];

/** What each lab language is called on screen. */
export const LAB_LANGUAGE_LABEL: Record<LabLanguage, string> = {
  rust: 'Rust', python: 'Python', bash: 'Bash', cpp: 'C++', csharp: 'C#', yaml: 'YAML', typescript: 'TypeScript',
};

/** The name a learner's file has in the sandbox, and in the editor's title bar. */
export const LAB_SOLUTION_FILE: Record<LabLanguage, string> = {
  rust: 'solution.rs', python: 'solution.py', bash: 'solution.sh', cpp: 'solution.cpp', csharp: 'solution.cs', yaml: 'solution.yaml',
  typescript: 'solution.ts',
};

export const QUESTION_TYPES = ['single', 'multiple', 'true_false'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const PUBLISH_STATUSES = ['draft', 'published', 'archived'] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const SUBMISSION_STATUSES = [
  'queued',
  'running',
  'passed',
  'failed',
  'compile_error',
  'timeout',
  'error',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** A submission in one of these states will not change again. */
export const FINAL_SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
  'passed',
  'failed',
  'compile_error',
  'timeout',
  'error',
];

export interface LevelInfo {
  key: Difficulty;
  rank: number;
  label: string;
  /** The temper color a steel blade shows at this heat; used as the level mark. */
  temper: string;
  mark: string;
}

export const LEVELS: readonly LevelInfo[] = [
  { key: 'basic', rank: 1, label: 'Basic', temper: 'Straw', mark: 'I' },
  { key: 'medium', rank: 2, label: 'Medium', temper: 'Bronze', mark: 'II' },
  { key: 'advanced', rank: 3, label: 'Advanced', temper: 'Violet', mark: 'III' },
  { key: 'professional', rank: 4, label: 'Professional', temper: 'Blue', mark: 'IV' },
];

export function levelInfo(key: Difficulty): LevelInfo {
  const found = LEVELS.find((level) => level.key === key);
  if (!found) throw new Error(`Unknown level: ${key}`);
  return found;
}
