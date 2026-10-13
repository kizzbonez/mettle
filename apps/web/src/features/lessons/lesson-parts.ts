export interface LessonPart {
  kind: 'text' | 'answers';
  markdown: string;
}

const ANSWERS = /^###\s+Answers\s*$/;
const NEXT_SECTION = /^##\s/;
const FENCE = /^(```|~~~)/;

/**
 * Splits a lesson into what is read and what is kept folded: everything under
 * a `### Answers` heading, up to the next `## ` section, is an answers part.
 * Headings inside a code block are text, not structure.
 */
export function splitLesson(body: string): LessonPart[] {
  const parts: LessonPart[] = [];
  let kind: LessonPart['kind'] = 'text';
  let lines: string[] = [];
  let inCode = false;
  const flush = () => {
    const markdown = lines.join('\n').trim();
    if (markdown) parts.push({ kind, markdown });
    lines = [];
  };
  for (const line of body.split('\n')) {
    if (FENCE.test(line)) inCode = !inCode;
    const opens = !inCode && ANSWERS.test(line);
    const closes = !inCode && kind === 'answers' && NEXT_SECTION.test(line);
    if (opens || closes) {
      flush();
      kind = opens ? 'answers' : 'text';
      if (opens) continue;
    }
    lines.push(line);
  }
  flush();
  return parts;
}
