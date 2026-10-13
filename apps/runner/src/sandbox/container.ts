import type { RunnerFile } from '@mettle/shared';
import { dockerOk, dockerRequest } from '../docker/http';
import { execInContainer } from '../docker/exec';
import { sandboxSpec, type SandboxLimits } from './spec';
import { packTar } from './tar';

const UPLOAD_TIMEOUT_MS = 10_000;

export async function createSandbox(limits: SandboxLimits): Promise<string> {
  const created = await dockerOk<{ Id: string }>('POST', '/containers/create', sandboxSpec(limits));
  await dockerOk('POST', `/containers/${created.Id}/start`);
  return created.Id;
}

/** Best effort: a sandbox that cannot be removed now is collected by the reaper. */
export async function destroySandbox(id: string): Promise<void> {
  try {
    await dockerRequest('DELETE', `/containers/${id}?force=true&v=true`);
  } catch {
    // The reaper removes leftovers.
  }
}

/**
 * Copies files into /work. `docker cp` cannot write to a tmpfs, so the archive
 * goes over stdin; `head -c` reads an exact byte count, which means the command
 * finishes without depending on the transport delivering end-of-file.
 */
export async function uploadFiles(id: string, files: RunnerFile[]): Promise<void> {
  const archive = packTar(files);
  const result = await execInContainer(id, {
    cmd: ['sh', '-c', `head -c ${archive.length} | tar -x -C /work -f -`],
    timeoutMs: UPLOAD_TIMEOUT_MS,
    stdin: archive,
  });
  if (result.exitCode !== 0) {
    throw new Error(`Could not copy files into the sandbox: ${result.stderr.trim() || 'unknown error'}`);
  }
}
