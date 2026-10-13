import type { Difficulty, PublishStatus } from '@mettle/shared';
import type { ExamDetail, ExamMode, PinnedQuestion } from '@/types/content-admin';
import { toInt } from '../shared/labels';

export const EXAMS = '/admin/content/exams';
export const MAX_RULES = 20;
export const MAX_PINNED = 300;

/** One row of a dynamic exam's blueprint: "take `count` questions matching these filters". */
export interface RuleDraft {
  /** Identifies the row on screen. Never sent. */
  key: string;
  /** An empty string means "any". */
  trackId: string;
  categoryId: string;
  difficulty: Difficulty | '';
  tag: string;
  count: string;
  /** The pool size the server reported for these filters when the exam was loaded. */
  saved?: { query: string; available: number };
}

export interface ExamForm {
  trackId: string;
  /** An empty string means the exam belongs to the whole track. */
  courseId: string;
  slug: string;
  title: string;
  description: string;
  mode: ExamMode;
  timeLimitMinutes: string;
  passPercent: string;
  shuffleOptions: boolean;
  /** Empty means unlimited. */
  maxAttempts: string;
  status: PublishStatus;
  sortOrder: string;
  rules: RuleDraft[];
  questions: PinnedQuestion[];
}

export const EXAM_FIELDS = [
  'trackId', 'courseId', 'slug', 'title', 'description', 'mode', 'timeLimitMinutes', 'passPercent', 'shuffleOptions', 'maxAttempts',
  'status', 'sortOrder', 'rules', 'questionIds',
];

/** The bank query that counts a rule's pool: the published questions matching its filters. */
export function poolQuery(rule: Pick<RuleDraft, 'trackId' | 'categoryId' | 'difficulty' | 'tag'>): string {
  const params = new URLSearchParams({ status: 'published', pageSize: '1' });
  if (rule.trackId) params.set('trackId', rule.trackId);
  if (rule.categoryId) params.set('categoryId', rule.categoryId);
  if (rule.difficulty) params.set('difficulty', rule.difficulty);
  if (rule.tag.trim()) params.set('tag', rule.tag.trim());
  return params.toString();
}

let made = 0;

/** A new rule, drawing from the exam's own track unless told otherwise. */
export function newRule(trackId: string): RuleDraft {
  made += 1;
  return { key: `new-${made}`, trackId, categoryId: '', difficulty: '', tag: '', count: '5' };
}

export function blankExam(): ExamForm {
  return {
    trackId: '', courseId: '', slug: '', title: '', description: '', mode: 'dynamic', timeLimitMinutes: '15', passPercent: '70',
    shuffleOptions: true, maxAttempts: '', status: 'draft', sortOrder: '0', rules: [], questions: [],
  };
}

export function examFormOf({ exam, rules, questions }: ExamDetail): ExamForm {
  return {
    trackId: exam.trackId,
    courseId: exam.courseId ?? '',
    slug: exam.slug,
    title: exam.title,
    description: exam.description,
    mode: exam.mode,
    timeLimitMinutes: String(exam.timeLimitMinutes),
    passPercent: String(exam.passPercent),
    shuffleOptions: exam.shuffleOptions,
    maxAttempts: exam.maxAttempts === null ? '' : String(exam.maxAttempts),
    status: exam.status,
    sortOrder: String(exam.sortOrder),
    rules: rules.map((rule) => {
      const filters = { trackId: rule.trackId ?? '', categoryId: rule.categoryId ?? '', difficulty: rule.difficulty ?? ('' as const), tag: rule.tag ?? '' };
      return { key: rule.id, ...filters, count: String(rule.count), saved: { query: poolQuery(filters), available: rule.available } };
    }),
    questions,
  };
}

/** The request body. Only the blueprint for the chosen mode is sent; the API then clears the other. */
export function examBodyOf(form: ExamForm) {
  const { rules, questions, ...exam } = form;
  return {
    ...exam,
    courseId: form.courseId || null,
    timeLimitMinutes: toInt(form.timeLimitMinutes),
    passPercent: toInt(form.passPercent),
    maxAttempts: form.maxAttempts.trim() === '' ? null : toInt(form.maxAttempts),
    sortOrder: toInt(form.sortOrder),
    rules: form.mode === 'dynamic'
      ? rules.map((rule) => ({
          trackId: rule.trackId || null, categoryId: rule.categoryId || null, difficulty: rule.difficulty || null,
          tag: rule.tag.trim() || null, count: toInt(rule.count),
        }))
      : [],
    questionIds: form.mode === 'fixed' ? questions.map((question) => question.id) : [],
  };
}
