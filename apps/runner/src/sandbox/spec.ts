import { config } from '../config';

export interface SandboxLimits {
  image: string;
  memoryMb: number;
  pids: number;
  /** Seconds after which the sandbox exits on its own, even if the runner dies. */
  lifetimeSeconds: number;
}

export const SANDBOX_LABEL = 'mettle.sandbox';
const SANDBOX_USER = '10001:10001';
const TMPFS_OWNER = 'uid=10001,gid=10001,mode=0700';
const MB = 1024 * 1024;

/**
 * The container a learner's code runs in. Every field here is a constant or a
 * number the runner computed; nothing from the request reaches this object.
 *
 * - no network, no capabilities, no privilege escalation
 * - read-only root filesystem; the only writable paths are two small tmpfs
 * - memory, swap, CPU and process-count limits enforced by cgroups
 * - an unprivileged uid that exists in no other container
 */
export function sandboxSpec(limits: SandboxLimits): Record<string, unknown> {
  const memoryBytes = limits.memoryMb * MB;
  return {
    Image: limits.image,
    Cmd: ['sleep', String(limits.lifetimeSeconds)],
    User: SANDBOX_USER,
    WorkingDir: '/work',
    Hostname: 'sandbox',
    NetworkDisabled: true,
    StopTimeout: 0,
    Labels: { [SANDBOX_LABEL]: '1' },
    HostConfig: {
      NetworkMode: 'none',
      ReadonlyRootfs: true,
      Tmpfs: {
        '/work': `rw,exec,nosuid,nodev,size=64m,${TMPFS_OWNER}`,
        '/tmp': `rw,noexec,nosuid,nodev,size=64m,${TMPFS_OWNER}`,
      },
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      PidsLimit: limits.pids,
      Memory: memoryBytes,
      MemorySwap: memoryBytes,
      NanoCpus: 1_000_000_000,
      Ulimits: [
        { Name: 'nofile', Soft: 256, Hard: 256 },
        { Name: 'core', Soft: 0, Hard: 0 },
      ],
      Init: true,
      LogConfig: { Type: 'none' },
      ...(config.sandboxRuntime ? { Runtime: config.sandboxRuntime } : {}),
    },
  };
}
