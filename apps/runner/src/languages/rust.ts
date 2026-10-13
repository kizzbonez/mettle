import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import type { Harness, LanguageSpec } from './types';

const RUSTC = [
  'rustc --edition 2021 --color never',
  '-C opt-level=1 -C debuginfo=0 -C overflow-checks=on',
  '-A dead_code -A unused',
  '-o lab main.rs',
].join(' ');

/** Compile, then delete the harness so the hidden tests are not left on disk. */
const COMPILE = `${RUSTC}; code=$?; rm -f main.rs; exit $code`;

function mainSource(request: RunnerRequest, nonce: string): string {
  const cases = request.tests.map((test, i) => `fn case_${i + 1}() {\n${test.code}\n}\n`);
  const arms = request.tests.map((_, i) => `        "case_${i + 1}" => case_${i + 1}(),`);
  return [
    '#![allow(dead_code, unused)]',
    '#[path = "solution.rs"]',
    'mod solution;',
    'use solution::*;',
    '',
    ...cases,
    'fn main() {',
    '    let name = std::env::args().nth(1).unwrap_or_default();',
    '    match name.as_str() {',
    ...arms,
    '        _ => std::process::exit(2),',
    '    }',
    `    println!("\\n${nonce}");`,
    '}',
    '',
  ].join('\n');
}

/**
 * The learner's file is compiled as the module `solution`; each test body
 * becomes a function in a generated `main.rs` and runs as `./lab case_N`.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  return {
    files: [
      { path: 'solution.rs', content: request.code },
      { path: 'main.rs', content: mainSource(request, nonce) },
      ...request.fixtures,
    ],
    compile: ['sh', '-c', COMPILE],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['./lab', `case_${i + 1}`] })),
  };
}

export const rust: LanguageSpec = {
  image: config.images.rust,
  minMemoryMb: 768,
  pids: 128,
  build,
};
