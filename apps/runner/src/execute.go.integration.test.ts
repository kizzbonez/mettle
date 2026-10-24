import type { RunnerRequest, RunnerTest } from '@mettle/shared';
import { describe, expect, it } from 'vitest';
import { execute } from './execute';

function request(code: string, tests: string[], extra: Partial<RunnerRequest> = {}): RunnerRequest {
  const cases: RunnerTest[] = tests.map((body, i) => ({ id: `t${i + 1}`, name: `test ${i + 1}`, code: body }));
  return { language: 'go', code, fixtures: [], tests: cases, timeLimitMs: 4000, memoryMb: 256, ...extra };
}

/** A test file: the body of func Test, after optional imports. */
function test(body: string, imports = ''): string {
  return `${imports}func Test(t *testing.T) {\n${body}\n}\n`;
}

const shop = String.raw`package main

import (
	"bufio"
	"errors"
	"fmt"
	"os"
)

var ErrEmpty = errors.New("empty cart")

type cart struct{ prices []int }

func (c *cart) add(cents int) { c.prices = append(c.prices, cents) }

func (c *cart) total() (int, error) {
	if len(c.prices) == 0 {
		return 0, fmt.Errorf("total: %w", ErrEmpty)
	}
	sum := 0
	for _, p := range c.prices {
		sum += p
	}
	return sum, nil
}

func greet(name string) { fmt.Printf("Hello, %s!\n", name) }

func main() {
	in := bufio.NewScanner(os.Stdin)
	for in.Scan() {
		fmt.Println("Hi,", in.Text())
	}
}
`;

describe('go sandbox', () => {
  it('passes a correct solution: unexported names, errors, output capture and the program itself', async () => {
    const tests = [
      test('\tc := &cart{}\n\tc.add(250)\n\tc.add(175)\n\ttotal, err := c.total()\n\tcheck.NoError(err, "a cart with two prices")\n\tcheck.Equal(total, 425, "the total of two prices")'),
      test('\t_, err := (&cart{}).total()\n\tcheck.ErrorIs(err, ErrEmpty, "an empty cart")\n\tcheck.True(strings.HasPrefix(err.Error(), "total:"), "the error says where")', 'import "strings"\n\n'),
      test('\tcheck.Equal(check.PrintedBy(func() { greet("Ada") }), "Hello, Ada!\\n", "the greeting")'),
      test('\tran := check.RunScript("Ada\\nBo\\n")\n\tcheck.Equal(ran.Out, "Hi, Ada\\nHi, Bo\\n", "one greeting per line")\n\tcheck.Equal(ran.Code, 0, "the exit status")'),
      test('\t_, err := os.Stat("case_1_test.go")\n\tcheck.True(os.IsNotExist(err), "the test sources are gone before tests run")', 'import "os"\n\n'),
    ];
    const result = await execute(request(shop, tests));
    expect(result.tests.map((t) => t.stderr)).toEqual(['', '', '', '', '']);
    expect(result.status).toBe('passed');
  });

  it('reports a compile error in the learner file, vet included', async () => {
    const result = await execute(request('package main\n\nimport "fmt"\n\nfunc show(n int) { fmt.Printf("%s\\n", n) }\n', [test('\tshow(1)')]));
    expect(result.status).toBe('compile_error');
    expect(`${result.compile?.stdout}${result.compile?.stderr}`).toMatch(/solution\.go:5:\d+: fmt\.Printf format %s has arg n of wrong type int/);
  });

  it('reports a failed check with both values, and a starter placeholder by function name', async () => {
    const wrong = 'package main\n\nfunc double(n int) int { return n + 1 }\n\nfunc later() int { panic("not implemented") }\n';
    const result = await execute(request(wrong, [test('\tcheck.Equal(double(4), 8, "double of 4")'), test('\tlater()')]));
    expect(result.tests[0]?.stderr).toContain('FAIL: double of 4\n  expected: 8\n  actual:   5');
    expect(result.tests[1]?.stderr).toContain('FAIL: unexpected panic in later: not implemented');
  });

  it('shows texts of several lines one numbered line at a time', async () => {
    const board = 'package main\n\nfunc board() string { return "Open\\nTea 2.50\\n" }\n';
    const result = await execute(request(board, [test('\tcheck.Equal(board(), "Open\\nTea 2.40\\n", "the board")')]));
    expect(result.tests[0]?.stderr).toBe(
      ['FAIL: the board', '  expected:', '    1 "Open"', '    2 "Tea 2.40"', '    3 ""', '  actual:', '    1 "Open"', '    2 "Tea 2.50"', '    3 ""', '  first difference: line 2', ''].join('\n'),
    );
  });

  it('fails a test with a data race, even when its checks pass', async () => {
    const racy = 'package main\n\nimport "sync"\n\nfunc count() int {\n\tn := 0\n\tvar wg sync.WaitGroup\n\tfor range 20 {\n\t\twg.Go(func() { n++ })\n\t}\n\twg.Wait()\n\treturn n\n}\n';
    const result = await execute(request(racy, [test('\tcheck.True(count() > 0, "counts something")')]));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('WARNING: DATA RACE');
  });

  it('does not accept a solution that exits before the checks run', async () => {
    const cheat = 'package main\n\nimport "os"\n\nfunc total() int { os.Exit(0); return 0 }\n';
    const result = await execute(request(cheat, [test('\tcheck.Equal(total(), 5, "total")')]));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('unexpected call to os.Exit(0) during test');
  });

  it('stops a blocked test at its deadline and shows where it waits', async () => {
    const stuck = 'package main\n\nfunc wait() int {\n\tch := make(chan int)\n\treturn <-ch\n}\n';
    const result = await execute(request(stuck, [test('\twait()')], { timeLimitMs: 2000 }));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toMatch(/^panic: test timed out after 1\.25s/);
    expect(result.tests[0]?.stderr).toContain('/work/solution.go:5');
  });

  it('builds tests for a package that is not main, and refuses to run it as a program', async () => {
    const library = 'package shop\n\nfunc Price(cents int) string { return "€" + string(rune(48+cents%10)) }\n';
    const result = await execute(request(library, [test('\tcheck.Equal(Price(7), "€7", "the price")'), test('\tcheck.RunScript("")')]));
    expect(result.tests[0]?.passed).toBe(true);
    expect(result.tests[1]?.stderr).toContain('FAIL: solution.go is not a program');
  });
});
