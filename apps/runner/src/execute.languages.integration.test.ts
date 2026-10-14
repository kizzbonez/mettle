import type { LabLanguage, RunnerRequest, RunnerTest } from '@mettle/shared';
import { describe, expect, it } from 'vitest';
import { execute } from './execute';

function request(language: LabLanguage, code: string, tests: string[], extra: Partial<RunnerRequest> = {}) {
  const cases: RunnerTest[] = tests.map((body, i) => ({ id: `t${i + 1}`, name: `test ${i + 1}`, code: body }));
  return { language, code, fixtures: [], tests: cases, timeLimitMs: 4000, memoryMb: 256, ...extra };
}

describe('c++ sandbox', () => {
  const total = '#include <numeric>\n#include <vector>\n\nint total(const std::vector<int>& xs) { return std::accumulate(xs.begin(), xs.end(), 0); }\n';

  it('passes a correct solution, with threads available', async () => {
    const threaded = `${total}\n#include <thread>\nint doubled(int x) { int out = 0; std::thread worker([&] { out = x * 2; }); worker.join(); return out; }\n`;
    const result = await execute(request('cpp', threaded, ['CHECK_EQ(total({1, 2, 3}), 6, "sum of three");', 'CHECK_EQ(doubled(21), 42, "worker result");']));
    expect(result.status).toBe('passed');
    expect(result.tests.map((t) => t.passed)).toEqual([true, true]);
  });

  it('reports a compile error against the learner file', async () => {
    const result = await execute(request('cpp', 'int total() { return 1 + ; }\n', ['total();']));
    expect(result.status).toBe('compile_error');
    expect(result.compile?.stderr).toContain('solution.cpp');
  });

  it('reports a failed check with its message and both values', async () => {
    const wrong = '#include <vector>\nstd::vector<int> evens() { return {2, 4, 7}; }\n';
    const result = await execute(request('cpp', wrong, ['CHECK_EQ(evens(), (std::vector<int>{2, 4, 6}), "the first three even numbers");']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('FAIL: the first three even numbers');
    expect(result.tests[0]?.stderr).toContain('actual:   [2, 4, 7]');
  });

  it('fails a test on a memory error instead of letting it pass by luck', async () => {
    const dangling = 'int stale() { int* p = new int(7); delete p; return *p; }\n';
    const result = await execute(request('cpp', dangling, ['stale();']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('heap-use-after-free');
  });

  it('fails a test that leaks memory', async () => {
    const leaky = '#include <string>\nint leak() { new std::string("never freed"); return 1; }\n';
    const result = await execute(request('cpp', leaky, ['CHECK_EQ(leak(), 1, "returns one");']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('detected memory leaks');
  });

  it('does not accept a solution that exits before the checks run', async () => {
    const cheat = '#include <cstdlib>\nint total() { std::exit(0); }\n';
    const result = await execute(request('cpp', cheat, ['CHECK_EQ(total(), 5, "total");']));
    expect(result.tests[0]?.exitCode).toBe(0);
    expect(result.status).toBe('failed');
  });

  it('lets the learner keep a main, and removes the harness after compiling', async () => {
    const withMain = '#include <fstream>\nbool harness_exists() { return std::ifstream("main.cpp").good(); }\nint main() { return harness_exists() ? 1 : 0; }\n';
    const result = await execute(request('cpp', withMain, ['CHECK(!harness_exists(), "the harness is gone");']));
    expect(result.status).toBe('passed');
  });
});

describe('c# sandbox', () => {
  const stock = [
    'public record Item(string Sku, int Quantity);',
    '',
    'public static class Stock',
    '{',
    '    public static int Total(IEnumerable<Item> items) => items.Sum(item => item.Quantity);',
    '    public static async Task<int> TotalAsync(IEnumerable<Item> items) { await Task.Yield(); return Total(items); }',
    '}',
    '',
  ].join('\n');

  it('passes a correct solution, including an awaited call', async () => {
    const tests = [
      'Check.Equal(Stock.Total(new[] { new Item("a", 2), new Item("b", 3) }), 5, "total of two items");',
      'Check.Equal(await Stock.TotalAsync(new[] { new Item("a", 2) }), 2, "async total");',
    ];
    const result = await execute(request('csharp', stock, tests));
    expect(result.status).toBe('passed');
    expect(result.tests.map((t) => t.passed)).toEqual([true, true]);
  });

  it('reports a compile error against the learner file', async () => {
    const result = await execute(request('csharp', 'public static class Stock { public static int Total() => ; }\n', ['Stock.Total();']));
    expect(result.status).toBe('compile_error');
    expect(`${result.compile?.stdout}${result.compile?.stderr}`).toContain('solution.cs');
  });

  it('reports a failed check with its message and both values', async () => {
    const tests = ['Check.SequenceEqual(new[] { 1, 2 }.Select(n => n * 2), new[] { 2, 5 }, "doubled values");'];
    const result = await execute(request('csharp', stock, tests));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('FAIL: doubled values');
    expect(result.tests[0]?.stderr).toContain('actual:   [2, 4]');
  });

  it('lets a test read what the code wrote to the console', async () => {
    const greeter = 'public static class Greeter\n{\n    public static void Hello(string name) => Console.WriteLine($"Hello, {name}!");\n}\n';
    const tests = ['Check.Equal(Printed.By(() => Greeter.Hello("Ada")), "Hello, Ada!\\n", "the greeting");', 'Check.Equal(Printed.By(() => Greeter.Hello("Ada")), "Hi\\n", "a wrong greeting");'];
    const result = await execute(request('csharp', greeter, tests));
    expect(result.tests.map((t) => t.passed)).toEqual([true, false]);
    expect(result.tests[1]?.stderr).toContain('actual:   "Hello, Ada!');
  });

  it('names an exception the test did not expect', async () => {
    const thrower = 'public static class Stock { public static int Total() => throw new InvalidOperationException("empty"); }\n';
    const result = await execute(request('csharp', thrower, ['Stock.Total();']));
    expect(result.tests[0]?.stderr).toContain('FAIL: unexpected InvalidOperationException: empty');
  });

  it('does not accept a solution that exits before the checks run', async () => {
    const cheat = 'public static class Stock { public static int Total() { Environment.Exit(0); return 0; } }\n';
    const result = await execute(request('csharp', cheat, ['Check.Equal(Stock.Total(), 5, "total");']));
    expect(result.tests[0]?.exitCode).toBe(0);
    expect(result.status).toBe('failed');
  });

  it('still runs the tests when the learner file has top-level statements', async () => {
    const result = await execute(request('csharp', 'Console.WriteLine("hello");\n', ['Check.True(false, "the test body ran");']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('FAIL: the test body ran');
  });
});

describe('yaml sandbox', () => {
  const compose = ['services:', '  web:', '    image: nginx:1.27', '    ports:', '      - "8080:80"', ''].join('\n');

  it('gives the tests the parsed document', async () => {
    const tests = ['assert at(doc, "services.web.image") == "nginx:1.27", "the web image"', 'assert len(docs) == 1 and "ports" in RAW, "one document"'];
    const result = await execute(request('yaml', compose, tests));
    expect(result.status).toBe('passed');
  });

  it('stops on invalid YAML with the line it is on', async () => {
    const result = await execute(request('yaml', 'services:\n  web:\n   image: nginx\n  ports: [80\n', ['assert doc']));
    expect(result.status).toBe('compile_error');
    expect(result.compile?.stderr).toContain('solution.yaml is not valid YAML');
    expect(result.compile?.stderr).toMatch(/line \d+/);
  });

  it('refuses a key written twice in one mapping', async () => {
    const result = await execute(request('yaml', 'name: api\nreplicas: 2\nname: worker\n', ['assert doc']));
    expect(result.status).toBe('compile_error');
    expect(result.compile?.stderr).toContain("the key 'name' appears twice");
  });

  it('resolves anchors and merge keys, and reads every document', async () => {
    const merged = ['base: &base', '  retries: 3', '  timeout: 10', 'job:', '  <<: *base', '  timeout: 30', '---', 'kind: second', ''].join('\n');
    const tests = ['assert doc["job"] == {"retries": 3, "timeout": 30}, "merged settings"', 'assert docs[1]["kind"] == "second", "second document"'];
    const result = await execute(request('yaml', merged, tests));
    expect(result.status).toBe('passed');
  });

  it('reports a failed assertion with its message', async () => {
    const result = await execute(request('yaml', compose, ['assert at(doc, "services.web.ports.0") == "80:80", "the published port"']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('the published port');
  });
});
