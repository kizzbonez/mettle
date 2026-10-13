import { describe, expect, it } from 'vitest';
import { splitLesson } from './lesson-parts';

const lesson = [
  '## Outline',
  '- Variables',
  '',
  '## Practice',
  '1. Declare a variable.',
  '',
  '### Answers',
  '1. `let x = 5;`',
  '',
  '```rust',
  '## not a heading',
  'let x = 5;',
  '```',
  '',
  '## Key takeaways',
  '- Variables are immutable by default.',
].join('\n');

describe('splitLesson', () => {
  it('returns one text part when a lesson has no answers', () => {
    expect(splitLesson('## Outline\n\nSome text.')).toEqual([{ kind: 'text', markdown: '## Outline\n\nSome text.' }]);
  });

  it('separates the answers from the text around them', () => {
    const parts = splitLesson(lesson);
    expect(parts.map((part) => part.kind)).toEqual(['text', 'answers', 'text']);
    expect(parts[0]?.markdown.endsWith('1. Declare a variable.')).toBe(true);
    expect(parts[2]?.markdown.startsWith('## Key takeaways')).toBe(true);
  });

  it('drops the answers heading and keeps their body, code included', () => {
    const answers = splitLesson(lesson)[1]?.markdown ?? '';
    expect(answers.startsWith('1. `let x = 5;`')).toBe(true);
    expect(answers).toContain('## not a heading');
    expect(answers).not.toContain('### Answers');
  });

  it('keeps answers that run to the end of the lesson', () => {
    const parts = splitLesson('## Practice\nTry it.\n\n### Answers\nDone.');
    expect(parts).toEqual([{ kind: 'text', markdown: '## Practice\nTry it.' }, { kind: 'answers', markdown: 'Done.' }]);
  });
});
