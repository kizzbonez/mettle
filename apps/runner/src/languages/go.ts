import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import { GO_CHECK } from './go-check';
import { GO_CHECK_RUN } from './go-check-run';
import { GO_CHECK_TEXT } from './go-check-text';
import type { Harness, LanguageSpec } from './types';

const GO_MOD = 'module lab\n\ngo 1.27\n';
const TEST_FUNC = /^func Test\(t \*testing\.T\) \{/m;
const PACKAGE = /^package\s+([A-Za-z_]\w*)/m;
const MAIN_FUNC = /^func main\(\)\s*\{/m;

/** The learner's package: the tests are compiled into it, so they see its unexported names. */
function packageOf(code: string): string {
  return PACKAGE.exec(code)?.[1] ?? 'main';
}

/**
 * A test file is Go source without the package clause: its own imports and declarations and one
 * `func Test(t *testing.T) {`, which becomes `TestCaseN` with the panic handler deferred on the
 * same line, so the line numbers in messages are the test file's own. `testing` and `lab/check`
 * are imported for it.
 */
function caseSource(pkg: string, code: string, n: number): string {
  const renamed = code.replace(TEST_FUNC, `func TestCase${n}(t *testing.T) { defer check.Recover();`);
  const body = renamed !== code ? renamed : `${code}\n\nfunc TestCase${n}(t *testing.T) {\n\tcheck.Fail("this test has no func Test(t *testing.T)")\n}`;
  return [
    `package ${pkg}`,
    '',
    'import (',
    '\t"testing"',
    '',
    '\t"lab/check"',
    ')',
    '',
    `//line case_${n}_test.go:1`,
    body,
    '',
    'var (',
    '\t_ = check.True',
    '\t_ testing.TB',
    ')',
    '',
  ].join('\n');
}

/** Prints the nonce on file descriptor 1 only when the test passed, whatever became of os.Stdout. */
function mainSource(pkg: string, nonce: string): string {
  return [
    `package ${pkg}`,
    '',
    'import (',
    '\t"os"',
    '\t"testing"',
    ')',
    '',
    'func TestMain(m *testing.M) {',
    '\tcode := m.Run()',
    '\tif code == 0 {',
    `\t\tos.NewFile(1, "stdout").WriteString("\\n${nonce}\\n")`,
    '\t}',
    '\tos.Exit(code)',
    '}',
    '',
  ].join('\n');
}

/**
 * Builds the tests (go test runs vet on the way) and, when the learner's file is a program, the
 * program itself for RunScript. Both use the race detector. The test sources are then deleted.
 */
function compileScript(program: boolean): string {
  return [
    // The module index caches files older than two seconds, as uploaded ones are, and treats a
    // write it cannot make to the read-only build cache as fatal.
    'export GODEBUG=goindex=0',
    'go test -race -c -o lab.test . || exit $?',
    ...(program ? ['go build -race -o program . || exit $?'] : []),
    'rm -rf case_*_test.go lab_main_test.go check',
    'exit 0',
  ].join('\n');
}

/** testing's own deadline comes first, so a stuck test prints where its goroutines are blocked. */
function testCommand(n: number, timeLimitMs: number): string[] {
  const deadline = Math.max(timeLimitMs - 750, 400);
  return ['./lab.test', `-test.run=^TestCase${n}$`, `-test.timeout=${deadline}ms`, '-test.paniconexit0'];
}

function build(request: RunnerRequest, nonce: string): Harness {
  const pkg = packageOf(request.code);
  const program = pkg === 'main' && MAIN_FUNC.test(request.code);
  return {
    files: [
      { path: 'go.mod', content: GO_MOD },
      { path: 'solution.go', content: request.code },
      { path: 'check/check.go', content: GO_CHECK },
      { path: 'check/run.go', content: GO_CHECK_RUN },
      { path: 'check/text.go', content: GO_CHECK_TEXT },
      { path: 'lab_main_test.go', content: mainSource(pkg, nonce) },
      ...request.tests.map((test, i) => ({ path: `case_${i + 1}_test.go`, content: caseSource(pkg, test.code, i + 1) })),
      ...request.fixtures,
    ],
    compile: ['sh', '-c', compileScript(program)],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: testCommand(i + 1, request.timeLimitMs) })),
  };
}

export const go: LanguageSpec = {
  image: config.images.go,
  minMemoryMb: 768,
  pids: 128,
  build,
};
