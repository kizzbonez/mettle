import { describe, expect, it } from 'vitest';
import { presentCompileOutput } from './compile-output';

// Real compiler output, captured from the sandbox.
const RUST = [
  'error[E0422]: cannot find struct, variant or union type `Movement` in this scope',
  '  --> main.rs:13:9',
  '   |',
  '13 |         Movement { sku: "KB-204".to_string(), kind: Kind::Inbound, quantity: 40 },',
  '   |         ^^^^^^^^ not found in this scope',
  '',
  'error[E0061]: this function takes 2 arguments but 1 argument was supplied',
  '  --> main.rs:21:5',
  '   |',
  '21 |     assert_eq!(add(secret_input()), 5);',
  '   |     ^^^--- argument #2 of type `i32` is missing',
  '   = help: a hidden hint about secret_input',
  'note: function defined here',
  '  --> solution.rs:1:8',
  '   |',
  '1  | pub fn add(a: i32, b: i32) -> i32 { a + b }',
  '   |        ^^^ ------  ------',
  '',
  'error[E0308]: mismatched types',
  ' --> solution.rs:4:5',
  '  |',
  '4 |     "text"',
  '  |     ^^^^^^ expected `i32`, found `&str`',
  '',
  'error: aborting due to 3 previous errors',
].join('\n');

const GCC = [
  'main.cpp: In function ‘void case_1()’:',
  'main.cpp:94:21: error: cannot convert ‘std::vector<int>’ to ‘int’',
  '   94 | CHECK_EQ(total(std::vector<int>{1, 2, 3}), 6, "sum of three");',
  '      |                     ^~~~~~~~~~~~~~~~~~~~',
  '      |                     |',
  '      |                     std::vector<int>',
  'main.cpp:85:65: note: in definition of macro ‘CHECK_EQ’',
  '   85 | #define CHECK_EQ(actual, expected, message) ::mettle::check_eq((actual), (expected), (message))',
  '      |                                                                 ^~~~~~',
  'In file included from main.cpp:34:',
  'solution.cpp:1:15: note:   initializing argument 1 of ‘int total(int)’',
  '    1 | int total(int a) { return a; }',
  '      |           ~~~~^',
  'main.cpp:95:10: error: ‘secret_rule’ was not declared in this scope',
  '   95 | CHECK_EQ(secret_rule(41), 42, "hidden rule");',
  '      |          ^~~~~~~~~~~',
].join('\n');

describe('presentCompileOutput', () => {
  it('removes the quoted test lines from rustc output and keeps the messages', () => {
    const shown = presentCompileOutput('rust', RUST);
    expect(shown).not.toContain('KB-204');
    expect(shown).not.toContain('secret_input');
    expect(shown).toContain('cannot find struct, variant or union type `Movement`');
    expect(shown).toContain('  --> in a test');
    expect(shown).toContain('error: aborting due to 3 previous errors');
  });

  it('leaves rustc excerpts of the learner file alone', () => {
    const shown = presentCompileOutput('rust', RUST);
    expect(shown).toContain('1  | pub fn add(a: i32, b: i32) -> i32 { a + b }');
    expect(shown).toContain('4 |     "text"');
    expect(shown).toContain('expected `i32`, found `&str`');
  });

  it('removes the quoted test lines from g++ output and keeps the messages', () => {
    const shown = presentCompileOutput('cpp', GCC);
    expect(shown).not.toContain('CHECK_EQ(');
    expect(shown).not.toContain('"hidden rule"');
    expect(shown).not.toContain('main.cpp');
    expect(shown).toContain('in a test: error: cannot convert ‘std::vector<int>’ to ‘int’');
    expect(shown).toContain('in a test: error: ‘secret_rule’ was not declared in this scope');
  });

  it('leaves g++ excerpts of the learner file alone', () => {
    const shown = presentCompileOutput('cpp', GCC);
    expect(shown).toContain('solution.cpp:1:15: note:   initializing argument 1 of ‘int total(int)’');
    expect(shown).toContain('    1 | int total(int a) { return a; }');
  });

  it('replaces the tests\' positions in Go output and keeps the learner file\'s', () => {
    const go = ['# lab [lab.test]', './case_2_test.go:7:3: undefined: secretRule', './solution.go:4:2: declared and not used: total', 'FAIL\tlab [build failed]'].join('\n');
    const shown = presentCompileOutput('go', go);
    expect(shown).toContain('in a test: undefined: secretRule');
    expect(shown).not.toContain('case_2_test.go');
    expect(shown).toContain('./solution.go:4:2: declared and not used: total');
    expect(shown).not.toContain('Note:');
  });

  it('explains a Go declaration that takes a name the tests use', () => {
    const go = ['./solution.go:3:6: check redeclared in this block', '\t./case_1_test.go:6:2: other declaration of check'].join('\n');
    const shown = presentCompileOutput('go', go);
    expect(shown).toContain('\tin a test: other declaration of check');
    expect(shown).toContain('Note: the tests use the names check, TestMain');
  });

  it('does not touch languages whose check step only reads the learner file', () => {
    const python = '  File "solution.py", line 1\n    def broken(:\n               ^\nSyntaxError: invalid syntax';
    expect(presentCompileOutput('python', python)).toBe(python);
    expect(presentCompileOutput('csharp', "tests.cs(9,19): error CS0117: 'Stock' does not contain a definition for 'Total'")).toContain('CS0117');
  });
});
