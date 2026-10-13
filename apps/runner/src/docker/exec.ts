import type { Duplex } from 'node:stream';
import type { RunnerStepOutput } from '@mettle/shared';
import { config } from '../config';
import { Demuxer, type Captured } from './demux';
import { dockerHijack, dockerOk } from './http';

export interface ExecOptions {
  cmd: string[];
  timeoutMs: number;
  /** Bytes written to the command's stdin. The command must not wait for EOF. */
  stdin?: Buffer;
}

export interface ExecResult extends RunnerStepOutput {
  stdoutTail: string;
}

/** How long past the in-container timeout the runner waits before giving up. */
const DEADLINE_GRACE_MS = 3000;
const KILLED_BY_SIGKILL = 137;

interface Collected extends Captured {
  deadlineHit: boolean;
}

function collect(socket: Duplex, deadlineMs: number): Promise<Collected> {
  return new Promise((resolve) => {
    const demuxer = new Demuxer(config.maxOutputBytes);
    let settled = false;
    const finish = (deadlineHit: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ ...demuxer.result(), deadlineHit });
    };
    const timer = setTimeout(() => finish(true), deadlineMs);
    socket.on('data', (chunk: Buffer) => demuxer.write(chunk));
    socket.on('end', () => finish(false));
    socket.on('close', () => finish(false));
    socket.on('error', () => finish(false));
  });
}

/**
 * Runs one command inside a running sandbox. The command is wrapped in
 * coreutils `timeout`, which kills its whole process group, so a runaway
 * test cannot outlive its time limit.
 */
export async function execInContainer(containerId: string, options: ExecOptions): Promise<ExecResult> {
  const seconds = (options.timeoutMs / 1000).toFixed(2);
  const created = await dockerOk<{ Id: string }>('POST', `/containers/${containerId}/exec`, {
    AttachStdin: options.stdin !== undefined,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    WorkingDir: '/work',
    Cmd: ['timeout', '-s', 'KILL', seconds, ...options.cmd],
  });

  const started = performance.now();
  const socket = await dockerHijack(`/exec/${created.Id}/start`, { Detach: false, Tty: false });
  if (options.stdin) socket.write(options.stdin);
  const output = await collect(socket, options.timeoutMs + DEADLINE_GRACE_MS);
  const durationMs = Math.round(performance.now() - started);

  const state = await dockerOk<{ ExitCode: number | null; Running: boolean }>(
    'GET',
    `/exec/${created.Id}/json`,
  );
  const exitCode = state.Running ? null : state.ExitCode;
  const ranOutOfTime = exitCode === KILLED_BY_SIGKILL && durationMs >= options.timeoutMs - 100;
  return {
    stdout: output.stdout,
    stderr: output.stderr + (output.truncated ? '\n[output truncated]' : ''),
    stdoutTail: output.stdoutTail,
    exitCode,
    durationMs,
    timedOut: output.deadlineHit || ranOutOfTime,
  };
}
