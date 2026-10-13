import { LAB_LANGUAGES, QUESTION_TYPES, type Difficulty } from '@mettle/shared';
import { z } from 'zod';

/** Shapes of the files under content/. See content/README.md. */

export const trackFile = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  category: z.string().regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().default(0),
  /** `course` is a full course from zero; `outline` is the original three-lesson format. */
  format: z.enum(['outline', 'course']).default('outline'),
  /** Raise this when the shipped track changes, so installs that already have it take the new version. */
  revision: z.number().int().min(1).default(1),
});

export const courseFile = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  outcomes: z.array(z.string().min(1)).min(1),
  exam: z.object({
    title: z.string().min(1),
    description: z.string().default(''),
    timeLimitMinutes: z.number().int().min(1).max(240).default(10),
    passPercent: z.number().int().min(1).max(100).default(70),
    /** How many questions an attempt draws from the level's bank (all of them, if the bank is smaller). */
    questionCount: z.number().int().min(1).max(50).default(10),
  }),
});

export const lessonFrontMatter = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  minutes: z.number().int().min(1).max(240),
  objectives: z.array(z.string().min(1)).min(1),
});

const option = z.object({ text: z.string().min(1), correct: z.boolean().default(false) });

export const questionFile = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    type: z.enum(QUESTION_TYPES),
    category: z.string().regex(/^[a-z0-9-]+$/).optional(),
    tags: z.array(z.string()).default([]),
    prompt: z.string().min(1),
    options: z.array(option).min(2).max(6),
    explanation: z.string().min(1),
  })
  .superRefine((question, ctx) => {
    const correct = question.options.filter((o) => o.correct).length;
    const ok = question.type === 'multiple' ? correct >= 2 : correct === 1;
    if (!ok) ctx.addIssue({ code: 'custom', message: `${question.key}: wrong number of correct options` });
    if (question.type === 'true_false' && question.options.length !== 2) {
      ctx.addIssue({ code: 'custom', message: `${question.key}: true_false needs exactly two options` });
    }
  });

export const labFile = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  language: z.enum(LAB_LANGUAGES),
  minutes: z.number().int().min(1).max(480),
  timeLimitMs: z.number().int().min(500).max(15_000).default(5000),
  memoryMb: z.number().int().min(32).max(1024).default(256),
  tests: z
    .array(z.object({ name: z.string().min(1), file: z.string().min(1), hidden: z.boolean().default(true) }))
    .min(1),
});

export interface ContentLesson extends z.infer<typeof lessonFrontMatter> {
  slug: string;
  body: string;
}

export type ContentQuestion = z.infer<typeof questionFile>;

export interface ContentLab extends Omit<z.infer<typeof labFile>, 'tests'> {
  scenario: string;
  instructions: string;
  starter: string;
  solution: string;
  fixtures: { path: string; content: string }[];
  tests: { name: string; hidden: boolean; code: string }[];
}

export interface ContentCourse extends z.infer<typeof courseFile> {
  level: Difficulty;
  lessons: ContentLesson[];
  questions: ContentQuestion[];
  lab: ContentLab | null;
}

export interface ContentTrack extends z.infer<typeof trackFile> {
  slug: string;
  courses: ContentCourse[];
}
