/** Reading and explaining a bulk import, before and after it is sent. */

export const IMPORT_LIMIT = 500;

export const IMPORT_EXAMPLE = `[
  {
    "type": "single",
    "difficulty": "basic",
    "promptMd": "What does \`2 + 2\` evaluate to?",
    "explanationMd": "Integer addition.",
    "tags": ["arithmetic"],
    "status": "draft",
    "options": [
      { "bodyMd": "3", "isCorrect": false },
      { "bodyMd": "4", "isCorrect": true },
      { "bodyMd": "22", "isCorrect": false }
    ]
  }
]`;

export type ParsedImport = { ok: true; questions: Record<string, unknown>[] } | { ok: false; problem: string };

function listOf(value: unknown): unknown {
  const wrapped = value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as { questions?: unknown }).questions : undefined;
  return wrapped ?? value;
}

/** Parses pasted or uploaded text. Accepts the bare array, or the `{ "questions": [...] }` the API takes. */
export function parseImport(text: string): ParsedImport | null {
  if (text.trim() === '') return null;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    return { ok: false, problem: `This is not valid JSON. ${cause instanceof Error ? cause.message : ''}`.trim() };
  }
  const list = listOf(value);
  if (!Array.isArray(list)) return { ok: false, problem: 'Expected a JSON array of questions.' };
  if (list.length === 0) return { ok: false, problem: 'The array is empty. Add at least one question.' };
  const stray = list.findIndex((item) => item === null || typeof item !== 'object' || Array.isArray(item));
  if (stray >= 0) return { ok: false, problem: `Item ${stray + 1} is not a question object.` };
  if (list.length > IMPORT_LIMIT) return { ok: false, problem: `${list.length.toLocaleString()} questions is more than one import takes. Split the file into parts of ${IMPORT_LIMIT} or fewer.` };
  return { ok: true, questions: list as Record<string, unknown>[] };
}

/** Fills in the track and category for questions that do not name their own. */
export function withDefaults(questions: Record<string, unknown>[], trackId: string, categoryId: string): Record<string, unknown>[] {
  return questions.map((question) => ({
    ...question,
    trackId: question.trackId === undefined ? trackId || null : question.trackId,
    categoryId: question.categoryId === undefined ? categoryId || null : question.categoryId,
  }));
}

export interface ImportFault {
  /** "Question 4", or "The file" for something not about one question. */
  where: string;
  /** The part of the question at fault, such as "options" or "option 2, bodyMd". */
  part: string;
  message: string;
}

/** Turns the API's field paths (`questions.3.options.1.bodyMd`) into something an author can find in their file. */
export function importFaults(fields: Record<string, string>): ImportFault[] {
  return Object.entries(fields).map(([path, message]) => {
    const [root, index, ...rest] = path.split('.');
    if (root !== 'questions' || index === undefined || !/^\d+$/.test(index)) return { where: 'The file', part: path === '_' ? '' : path, message };
    const part = rest.join('.').replace(/^options\.(\d+)\.?/, (_match, option: string) => `option ${Number(option) + 1}, `).replace(/, $/, '');
    return { where: `Question ${Number(index) + 1}`, part, message };
  });
}
