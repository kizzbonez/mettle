import type { LabLanguage, RunnerRequest, RunnerTest } from '@mettle/shared';
import { describe, expect, it } from 'vitest';
import { execute } from './execute';

function request(language: LabLanguage, code: string, tests: string[], extra: Partial<RunnerRequest> = {}) {
  const cases: RunnerTest[] = tests.map((body, i) => ({ id: `t${i + 1}`, name: `test ${i + 1}`, code: body }));
  return { language, code, fixtures: [], tests: cases, timeLimitMs: 4000, memoryMb: 256, ...extra };
}

describe('rust sandbox', () => {
  const add = 'pub fn add(a: i32, b: i32) -> i32 { a + b }';

  it('passes a correct solution', async () => {
    const result = await execute(request('rust', add, ['assert_eq!(add(2, 3), 5);', 'assert_eq!(add(-1, 1), 0);']));
    expect(result.status).toBe('passed');
    expect(result.tests.map((t) => t.passed)).toEqual([true, true]);
    expect(result.compile?.exitCode).toBe(0);
  });

  it('reports a compile error against the learner file', async () => {
    const result = await execute(request('rust', 'pub fn add(a: i32, b: i32) -> i32 { a + }', ['add(1, 1);']));
    expect(result.status).toBe('compile_error');
    expect(result.compile?.stderr).toContain('solution.rs');
    expect(result.tests).toEqual([]);
  });

  it('reports a failed assertion with its message', async () => {
    const wrong = 'pub fn add(a: i32, b: i32) -> i32 { a - b }';
    const result = await execute(request('rust', wrong, ['assert_eq!(add(2, 3), 5, "2 + 3 should be 5");']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('2 + 3 should be 5');
  });

  it('does not accept a solution that exits before the assertions run', async () => {
    const cheat = 'pub fn add(_a: i32, _b: i32) -> i32 { std::process::exit(0) }';
    const result = await execute(request('rust', cheat, ['assert_eq!(add(2, 3), 5);']));
    expect(result.tests[0]?.exitCode).toBe(0);
    expect(result.tests[0]?.passed).toBe(false);
    expect(result.status).toBe('failed');
  });

  it('removes the generated harness after compiling', async () => {
    const probe = 'pub fn harness_exists() -> bool { std::path::Path::new("main.rs").exists() }';
    const result = await execute(request('rust', probe, ['assert!(!harness_exists());']));
    expect(result.status).toBe('passed');
  });
});

describe('python sandbox', () => {
  it('passes a correct solution and has numpy', async () => {
    const code = 'import numpy as np\n\ndef norm(v):\n    return float(np.linalg.norm(np.array(v)))\n';
    const result = await execute(request('python', code, ['assert abs(norm([3, 4]) - 5.0) < 1e-9']));
    expect(result.status).toBe('passed');
  });

  it('reports a syntax error from the check step', async () => {
    const result = await execute(request('python', 'def broken(:\n    pass\n', ['broken()']));
    expect(result.status).toBe('compile_error');
    expect(result.compile?.stderr).toContain('SyntaxError');
  });

  it('kills an infinite loop at the time limit', async () => {
    const spin = 'def spin():\n    while True:\n        pass\n';
    const result = await execute(request('python', spin, ['spin()'], { timeLimitMs: 1500 }));
    expect(result.status).toBe('timeout');
    expect(result.tests[0]?.timedOut).toBe(true);
    expect(result.tests[0]?.durationMs).toBeLessThan(5000);
  });

  it('survives a flood of output', async () => {
    const flood = 'def flood():\n    for _ in range(200000):\n        print("x" * 100)\n';
    const result = await execute(request('python', flood, ['flood()']));
    expect(result.status).toBe('passed');
    expect(result.tests[0]?.stdout.length).toBeLessThanOrEqual(64 * 1024);
    expect(result.tests[0]?.stderr).toContain('[output truncated]');
  });
});

describe('bash sandbox', () => {
  it('runs a script against a fixture', async () => {
    const code = 'grep -c "Failed password" "$1"\n';
    const fixtures = [{ path: 'data/auth.log', content: 'Failed password\nAccepted password\nFailed password\n' }];
    const test = 'assert_eq "$(bash solution.sh data/auth.log)" "2" "failed login count"';
    const result = await execute(request('bash', code, [test], { fixtures }));
    expect(result.status).toBe('passed');
  });

  it('shows expected and actual values on a failed assertion', async () => {
    const result = await execute(request('bash', 'echo 1\n', ['assert_eq "$(bash solution.sh)" "2" "count"']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('expected: 2');
  });
});

describe('sandbox isolation', () => {
  const noop = 'x = 1\n';

  async function probe(body: string) {
    const result = await execute(request('python', noop, [body]));
    return result.tests[0];
  }

  it('has no network', async () => {
    const body = [
      'import socket',
      'try:',
      '    socket.create_connection(("1.1.1.1", 53), timeout=2)',
      '    raise SystemExit("network reachable")',
      'except OSError:',
      '    pass',
    ].join('\n');
    expect((await probe(body))?.passed).toBe(true);
  });

  it('runs as an unprivileged user on a read-only root filesystem', async () => {
    const body = [
      'import os',
      'assert os.getuid() == 10001, os.getuid()',
      'for path in ("/etc/owned", "/usr/owned", "/owned"):',
      '    try:',
      '        open(path, "w")',
      '        raise SystemExit(f"wrote {path}")',
      '    except OSError:',
      '        pass',
    ].join('\n');
    expect((await probe(body))?.passed).toBe(true);
  });

  it('holds no capabilities and cannot gain privileges', async () => {
    const body = [
      'status = open("/proc/self/status").read()',
      'fields = dict(line.split(":\\t", 1) for line in status.splitlines() if ":\\t" in line)',
      'assert int(fields["CapEff"], 16) == 0, fields["CapEff"]',
      'assert int(fields["CapBnd"], 16) == 0, fields["CapBnd"]',
      'assert fields["NoNewPrivs"].strip() == "1", fields["NoNewPrivs"]',
    ].join('\n');
    expect((await probe(body))?.passed).toBe(true);
  });

  it('cannot reach the Docker socket or the host filesystem', async () => {
    const body = [
      'import os',
      'assert not os.path.exists("/var/run/docker.sock")',
      'assert not os.path.exists("/host")',
    ].join('\n');
    expect((await probe(body))?.passed).toBe(true);
  });

  it('stops a fork bomb at the process limit', async () => {
    const body = [
      'import os, time',
      'spawned = 0',
      'try:',
      '    for _ in range(500):',
      '        if os.fork() == 0:',
      '            time.sleep(3)',
      '            os._exit(0)',
      '        spawned += 1',
      'except OSError:',
      '    pass',
      'assert spawned < 100, spawned',
    ].join('\n');
    expect((await probe(body))?.passed).toBe(true);
  });

  it('kills a process that exceeds the memory limit', async () => {
    const result = await probe('blob = bytearray(1024 * 1024 * 1024)\nfor i in range(0, len(blob), 4096):\n    blob[i] = 1');
    expect(result?.passed).toBe(false);
  });

  it('cannot fill the disk beyond the scratch quota', async () => {
    const body = [
      'try:',
      '    with open("/work/big", "wb") as handle:',
      '        for _ in range(200):',
      '            handle.write(b"\\0" * 1024 * 1024)',
      '    raise SystemExit("wrote 200 MB")',
      'except OSError:',
      '    pass',
    ].join('\n');
    expect((await probe(body))?.passed).toBe(true);
  });
});
