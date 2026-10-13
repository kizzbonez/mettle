import type { RunnerRequest } from '@mettle/shared';
import { describe, expect, it } from 'vitest';
import { languages } from './registry';

const NONCE = 'mettle-nonce';

function request(overrides: Partial<RunnerRequest>): RunnerRequest {
  return {
    language: 'rust',
    code: 'LEARNER_CODE',
    fixtures: [{ path: 'data/input.txt', content: 'fixture' }],
    tests: [
      { id: 'a', name: 'first', code: 'TEST_BODY_A' },
      { id: 'b', name: 'second', code: 'TEST_BODY_B' },
    ],
    timeLimitMs: 2000,
    memoryMb: 128,
    ...overrides,
  };
}

function file(files: { path: string; content: string }[], path: string): string {
  const found = files.find((f) => f.path === path);
  if (!found) throw new Error(`missing ${path}`);
  return found.content;
}

describe('rust harness', () => {
  const harness = languages.rust.build(request({ language: 'rust' }), NONCE);

  it('keeps the learner code in its own file, unmodified', () => {
    expect(file(harness.files, 'solution.rs')).toBe('LEARNER_CODE');
  });

  it('wraps each test body in a function and prints the nonce last', () => {
    const main = file(harness.files, 'main.rs');
    expect(main).toContain('fn case_1() {\nTEST_BODY_A\n}');
    expect(main).toContain('"case_2" => case_2(),');
    expect(main.trimEnd().endsWith(`println!("\\n${NONCE}");\n}`)).toBe(true);
  });

  it('runs each test as its own process', () => {
    expect(harness.tests).toEqual([
      { id: 'a', cmd: ['./lab', 'case_1'] },
      { id: 'b', cmd: ['./lab', 'case_2'] },
    ]);
  });
});

describe('python harness', () => {
  const harness = languages.python.build(request({ language: 'python' }), NONCE);

  it('imports the solution before the test body and prints the nonce after it', () => {
    const lines = file(harness.files, 'case_1.py').trim().split('\n');
    expect(lines[0]).toContain('from solution import *');
    expect(lines).toContain('TEST_BODY_A');
    expect(lines.at(-1)).toBe(`print("\\n${NONCE}")`);
  });

  it('syntax-checks the solution first', () => {
    expect(harness.compile).toEqual(['python', '-m', 'py_compile', 'solution.py']);
  });
});

describe('bash harness', () => {
  const harness = languages.bash.build(request({ language: 'bash' }), NONCE);

  it('gives test bodies the assertion helpers', () => {
    const script = file(harness.files, 'case_2.sh');
    expect(script).toContain('assert_eq() {');
    expect(script).toContain('TEST_BODY_B');
    expect(script.trimEnd().endsWith(`'${NONCE}'`)).toBe(true);
  });
});

describe('every harness', () => {
  it.each(Object.keys(languages) as (keyof typeof languages)[])('%s ships the fixtures', (language) => {
    const harness = languages[language].build(request({ language }), NONCE);
    expect(file(harness.files, 'data/input.txt')).toBe('fixture');
  });
});
