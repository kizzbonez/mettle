import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import type { Harness, LanguageSpec } from './types';

const RUSTC = [
  'rustc --edition 2024 --color never',
  '-C opt-level=1 -C debuginfo=0 -C overflow-checks=on',
  '-A dead_code -A unused',
  '-o lab main.rs',
].join(' ');

/** Compile, then delete the harness so the hidden tests are not left on disk. */
const COMPILE = `${RUSTC}; code=$?; rm -f main.rs; exit $code`;

/**
 * A helper every Rust test body can call: `printed_by(|| greet())` returns what
 * the code printed. A process cannot read its own standard output, so the test
 * is started again as a copy that runs up to that call, prints a marker, runs
 * the code and stops; whatever follows the marker is what the code printed.
 * This is what lets a lab about `println!` check the output itself.
 */
const PRINTED_BY = String.raw`fn printed_by<F: FnOnce()>(body: F) -> String {
    use std::io::Write;
    use std::sync::atomic::{AtomicUsize, Ordering};
    static CALLS: AtomicUsize = AtomicUsize::new(0);
    const MARK: &str = "\u{1e}printed_by\n";
    let call = CALLS.fetch_add(1, Ordering::SeqCst);
    let target = std::env::var("METTLE_PRINTED_BY").ok().and_then(|value| value.parse::<usize>().ok());
    if target == Some(call) {
        print!("{MARK}");
        body();
        std::io::stdout().flush().ok();
        std::process::exit(0);
    }
    let mut args = std::env::args();
    let program = args.next().unwrap_or_default();
    let case = args.next().unwrap_or_default();
    let copy = std::process::Command::new(program)
        .arg(case)
        .env("METTLE_PRINTED_BY", call.to_string())
        .output()
        .expect("the test could not start a copy of itself");
    eprint!("{}", String::from_utf8_lossy(&copy.stderr));
    assert!(copy.status.success(), "the code runs to its end without a panic");
    let printed = String::from_utf8_lossy(&copy.stdout);
    printed.rsplit(MARK).next().unwrap_or_default().to_string()
}
`;

function mainSource(request: RunnerRequest, nonce: string): string {
  const cases = request.tests.map((test, i) => `fn case_${i + 1}() {\n${test.code}\n}\n`);
  const arms = request.tests.map((_, i) => `        "case_${i + 1}" => case_${i + 1}(),`);
  return [
    '#![allow(dead_code, unused)]',
    '#[path = "solution.rs"]',
    'mod solution;',
    'use solution::*;',
    '',
    PRINTED_BY,
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
