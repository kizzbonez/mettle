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

describe('typescript harness', () => {
  const harness = languages.typescript.build(request({ language: 'typescript' }), NONCE);

  it('keeps the learner file as solution.ts and gives each test the helpers', () => {
    expect(file(harness.files, 'solution.ts')).toBe('LEARNER_CODE');
    const test = file(harness.files, 'case_1.ts');
    expect(test.split('\n')[0]).toContain('from "./lab_helpers.js"');
    expect(test).toContain('TEST_BODY_A');
  });

  it('type-checks the learner file, then each test, then deletes the test sources', () => {
    const script = harness.compile?.[2] ?? '';
    expect(script.split('\n')[0]).toBe('tsc -p tsconfig.json || exit $?');
    expect(script).toContain('tsc -p tsconfig.case_2.json > out/case_2.check');
    expect(script).toContain('rm -f case_*.ts tsconfig.case_*.json');
  });

  it('runs each compiled test through the runner that prints the nonce last', () => {
    expect(harness.tests[1]?.cmd.at(-1)).toContain('lab_run.mjs out/case_2.js');
    expect(file(harness.files, 'lab_run.mjs')).toContain(`"\\n${NONCE}\\n"`);
  });
});

describe('go harness', () => {
  const tests = [
    { id: 'a', name: 'first', code: 'import "strings"\n\nfunc Test(t *testing.T) {\n\tTEST_BODY_A\n}' },
    { id: 'b', name: 'second', code: 'func helper() {}' },
  ];
  const harness = languages.go.build(request({ language: 'go', code: 'package shop\n\nfunc main() {}\n', tests }), NONCE);

  it('compiles each test into the learner package with its line numbers kept', () => {
    const first = file(harness.files, 'case_1_test.go');
    expect(first.split('\n')[0]).toBe('package shop');
    expect(first).toContain('//line case_1_test.go:1\nimport "strings"');
    expect(first).toContain('func TestCase1(t *testing.T) { defer check.Recover();\n\tTEST_BODY_A');
    expect(file(harness.files, 'check/check.go')).toContain('func Equal[T any](got, want T, message string)');
  });

  it('fails a test file that has no func Test instead of passing it', () => {
    expect(file(harness.files, 'case_2_test.go')).toContain('func TestCase2(t *testing.T) {\n\tcheck.Fail(');
  });

  it('builds the program only for package main, then deletes the test sources', () => {
    const script = harness.compile?.[2] ?? '';
    expect(script).toContain('go test -race -c -o lab.test .');
    expect(script).not.toContain('go build');
    expect(script).toContain('rm -rf case_*_test.go lab_main_test.go check');
    const program = languages.go.build(request({ language: 'go', code: 'package main\n\nfunc main() {\n}\n' }), NONCE);
    expect(program.compile?.[2]).toContain('go build -race -o program .');
  });

  it('runs one test per process under a deadline shorter than the time limit', () => {
    expect(harness.tests[1]?.cmd).toEqual(['./lab.test', '-test.run=^TestCase2$', '-test.timeout=1250ms', '-test.paniconexit0']);
    expect(file(harness.files, 'lab_main_test.go')).toContain(`WriteString("\\n${NONCE}\\n")`);
  });
});

describe('solidity harness', () => {
  const harness = languages.solidity.build(request({ language: 'solidity' }), NONCE);

  it('puts the learner file in src/ and the imports on each test file\'s first line', () => {
    expect(file(harness.files, 'src/solution.sol')).toBe('LEARNER_CODE');
    const test = file(harness.files, 'test/Case2.t.sol');
    expect(test.split('\n')).toHaveLength(2);
    expect(test).toMatch(/^\/\* SPDX-License-Identifier: UNLICENSED \*\/ pragma solidity .*import "\.\.\/src\/solution\.sol"; TEST_BODY_B\n$/);
    expect(file(harness.files, 'foundry.toml')).toContain('offline = true');
  });

  it('builds once, then runs each test file alone and prints the nonce only when every test passed', () => {
    expect(harness.compile).toEqual(['forge', 'build']);
    const script = harness.tests[1]?.cmd.at(-1) ?? '';
    expect(script).toContain('forge test --match-path test/Case2.t.sol -vv --json');
    expect(script).toContain(`jq -e -f .lab/passed.jq /tmp/case_2.json > /dev/null; then printf '\\n%s\\n' '${NONCE}'`);
    expect(file(harness.files, '.lab/passed.jq')).toContain('all(.status == "Success")');
  });
});

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
    const imported = lines.indexOf('globals().update(load_solution())');
    expect(imported).toBeGreaterThan(0);
    expect(imported).toBeLessThan(lines.indexOf('TEST_BODY_A'));
    expect(lines.at(-1)).toBe(`print("\\n${NONCE}")`);
  });

  it('gives test bodies run_script and printed_by', () => {
    expect(file(harness.files, 'case_1.py')).toContain('from lab_helpers import Ran, check_array, check_frame, load_solution, printed_by, run_script');
    expect(file(harness.files, 'lab_helpers.py')).toContain('def run_script(stdin="", args=()):');
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

describe('c++ harness', () => {
  const harness = languages.cpp.build(request({ language: 'cpp' }), NONCE);
  const main = file(harness.files, 'main.cpp');

  it('includes the learner file untouched, with its main renamed out of the way', () => {
    expect(file(harness.files, 'solution.cpp')).toBe('LEARNER_CODE');
    expect(main).toContain('#define main mettle_learner_main\n#include "solution.cpp"\n#undef main');
  });

  it('wraps each test body in a function and prints the nonce only after it returns', () => {
    expect(main).toContain('static void case_2() {\nTEST_BODY_B\n}');
    expect(main).toContain('else if (name == "case_2") case_2();');
    expect(main.indexOf(NONCE)).toBeGreaterThan(main.indexOf('catch (...)'));
  });

  it('builds with the sanitizers and removes the harness afterwards', () => {
    expect(harness.compile?.[2]).toContain('-fsanitize=address,undefined');
    expect(harness.compile?.[2]).toContain('rm -f main.cpp');
  });
});

describe('c# harness', () => {
  const harness = languages.csharp.build(request({ language: 'csharp' }), NONCE);
  const tests = file(harness.files, 'tests.cs');

  it('keeps the learner code in its own file and imports the usual namespaces', () => {
    expect(file(harness.files, 'solution.cs')).toBe('LEARNER_CODE');
    expect(file(harness.files, 'usings.cs')).toContain('global using System.Linq;');
  });

  it('wraps each test body in an async method and prints the nonce only after it returns', () => {
    expect(tests).toContain('static async Task Case1()\n    {\nTEST_BODY_A\n    }');
    expect(tests).toContain('case "case_2": Case2().GetAwaiter().GetResult(); break;');
    expect(tests.indexOf(NONCE)).toBeGreaterThan(tests.indexOf('catch (Exception error)'));
  });

  it('owns the entry point and removes the harness afterwards', () => {
    expect(harness.compile?.[2]).toContain('-main:MettleLab');
    expect(harness.compile?.[2]).toContain('rm -f tests.cs');
    expect(harness.tests[1]).toEqual({ id: 'b', cmd: ['dotnet', 'lab.dll', 'case_2'] });
  });
});

describe('yaml harness', () => {
  const harness = languages.yaml.build(request({ language: 'yaml' }), NONCE);

  it('parses the learner file strictly before any test runs', () => {
    expect(file(harness.files, 'solution.yaml')).toBe('LEARNER_CODE');
    expect(harness.compile).toEqual(['python', 'lab_yaml.py']);
    expect(file(harness.files, 'lab_yaml.py')).toContain('appears twice in the same mapping');
  });

  it('gives each test body the parsed file and prints the nonce after it', () => {
    const lines = file(harness.files, 'case_1.py').trim().split('\n');
    expect(lines[1]).toContain('from lab_yaml import RAW, at, doc, docs');
    expect(lines).toContain('TEST_BODY_A');
    expect(lines.at(-1)).toBe(`print("\\n${NONCE}")`);
  });
});

describe('every harness', () => {
  it.each(Object.keys(languages) as (keyof typeof languages)[])('%s ships the fixtures', (language) => {
    const harness = languages[language].build(request({ language }), NONCE);
    expect(file(harness.files, 'data/input.txt')).toBe('fixture');
  });
});
