import type { Difficulty, PublishStatus, QuestionType } from '@mettle/shared';
import type { AdminQuestion } from '@/types/content-admin';

export interface OptionDraft {
  /** Identifies the row on screen. Never sent. */
  key: string;
  /** The saved option's id. Sent back so the option is updated in place: past attempts refer to it. */
  id?: string;
  bodyMd: string;
  isCorrect: boolean;
}

export interface QuestionForm {
  /** An empty string means no track. */
  trackId: string;
  categoryId: string;
  difficulty: Difficulty;
  type: QuestionType;
  promptMd: string;
  explanationMd: string;
  tags: string[];
  status: PublishStatus;
  options: OptionDraft[];
}

export const MAX_OPTIONS = 8;
export const MIN_OPTIONS = 2;
export const QUESTION_FIELDS = ['trackId', 'categoryId', 'difficulty', 'type', 'promptMd', 'explanationMd', 'tags', 'status', 'options'];

let made = 0;

export function newOption(bodyMd = '', isCorrect = false): OptionDraft {
  made += 1;
  return { key: `new-${made}`, bodyMd, isCorrect };
}

export function blankQuestion(trackId: string): QuestionForm {
  return {
    trackId, categoryId: '', difficulty: 'basic', type: 'single', promptMd: '', explanationMd: '', tags: [], status: 'draft',
    options: [newOption(), newOption(), newOption(), newOption()],
  };
}

export function questionFormOf(question: AdminQuestion): QuestionForm {
  return {
    trackId: question.trackId ?? '',
    categoryId: question.categoryId ?? '',
    difficulty: question.difficulty,
    type: question.type,
    promptMd: question.promptMd,
    explanationMd: question.explanationMd,
    tags: question.tags,
    status: question.status,
    options: question.options.map((option) => ({ key: option.id, id: option.id, bodyMd: option.bodyMd, isCorrect: option.isCorrect })),
  };
}

export function questionBodyOf(form: QuestionForm) {
  return {
    ...form,
    trackId: form.trackId || null,
    categoryId: form.categoryId || null,
    options: form.options.map(({ id, bodyMd, isCorrect }) => (id ? { id, bodyMd, isCorrect } : { bodyMd, isCorrect })),
  };
}

/** Marks an option correct: the only one for single and true/false, one of several for multiple. */
export function markCorrect(form: QuestionForm, key: string): OptionDraft[] {
  if (form.type === 'multiple') return form.options.map((option) => (option.key === key ? { ...option, isCorrect: !option.isCorrect } : option));
  return form.options.map((option) => ({ ...option, isCorrect: option.key === key }));
}

/**
 * Changes the type and brings the options in line with it: a true/false
 * question starts as True and False when nothing has been written yet, and a
 * type with one answer keeps only the first option marked correct.
 */
export function withType(form: QuestionForm, type: QuestionType): QuestionForm {
  let options = form.options;
  if (type === 'true_false') {
    const written = options.filter((option) => option.bodyMd.trim() !== '');
    if (written.length === 0) options = [newOption('True', true), newOption('False')];
    else if (written.length <= 2) options = written.length === 2 ? written : [...written, newOption()];
  }
  if (type !== 'multiple') {
    const first = options.findIndex((option) => option.isCorrect);
    options = options.map((option, index) => ({ ...option, isCorrect: index === first }));
  }
  return { ...form, type, options };
}
