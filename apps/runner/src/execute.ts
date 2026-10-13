import { randomBytes } from 'node:crypto';
import type { RunnerRequest, RunnerResponse, RunnerStepOutput, RunnerTestResult } from '@mettle/shared';
import { config } from './config';
import { execInContainer, type ExecResult } from './docker/exec';
import { judgeTest, overallStatus } from './judge';
import { languages } from './languages/registry';
import type { Harness } from './languages/types';
import { createSandbox, destroySandbox, uploadFiles } from './sandbox/container';

const LIFETIME_MARGIN_SECONDS = 20;

function stepOutput(result: ExecResult): RunnerStepOutput {
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    timedOut: result.timedOut,
  };
}

function lifetimeSeconds(request: RunnerRequest): number {
  const budgetMs = config.compileTimeoutMs + request.tests.length * request.timeLimitMs;
  return Math.ceil(budgetMs / 1000) + LIFETIME_MARGIN_SECONDS;
}

async function runTests(
  sandbox: string,
  harness: Harness,
  request: RunnerRequest,
  nonce: string,
): Promise<RunnerTestResult[]> {
  const results: RunnerTestResult[] = [];
  for (const test of harness.tests) {
    const output = await execInContainer(sandbox, { cmd: test.cmd, timeoutMs: request.timeLimitMs });
    results.push(judgeTest(test.id, output, nonce));
  }
  return results;
}

/** One submission, one sandbox: upload, build, run each test, destroy. */
export async function execute(request: RunnerRequest): Promise<RunnerResponse> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  const language = languages[request.language];
  const nonce = `mettle-${randomBytes(16).toString('hex')}`;
  const harness = language.build(request, nonce);
  const memoryMb = Math.min(Math.max(request.memoryMb, language.minMemoryMb), config.maxMemoryMb);

  const sandbox = await createSandbox({
    image: language.image,
    memoryMb,
    pids: language.pids,
    lifetimeSeconds: lifetimeSeconds(request),
  });
  try {
    await uploadFiles(sandbox, harness.files);
    let compile: RunnerStepOutput | null = null;
    if (harness.compile) {
      const built = await execInContainer(sandbox, {
        cmd: harness.compile,
        timeoutMs: config.compileTimeoutMs,
      });
      compile = stepOutput(built);
      if (built.exitCode !== 0) {
        const status = built.timedOut ? 'timeout' : 'compile_error';
        return { status, compile, tests: [], durationMs: elapsed() };
      }
    }
    const tests = await runTests(sandbox, harness, request, nonce);
    return { status: overallStatus(tests), compile, tests, durationMs: elapsed() };
  } finally {
    await destroySandbox(sandbox);
  }
}
