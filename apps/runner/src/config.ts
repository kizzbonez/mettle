function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`${name} must be an integer`);
  return value;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function defaultSocket(): string {
  return process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
}

export const config = {
  port: int('RUNNER_PORT', 4100),
  host: process.env.RUNNER_HOST ?? '0.0.0.0',
  /** Shared secret the API presents; the runner has no other caller. */
  token: required('RUNNER_TOKEN'),
  dockerSocket: process.env.DOCKER_SOCKET ?? defaultSocket(),
  /** OCI runtime for sandboxes, e.g. `runsc` for gVisor. Empty uses the default. */
  sandboxRuntime: process.env.SANDBOX_RUNTIME ?? '',
  maxConcurrency: int('RUNNER_MAX_CONCURRENCY', 2),
  maxQueue: int('RUNNER_MAX_QUEUE', 24),
  compileTimeoutMs: int('RUNNER_COMPILE_TIMEOUT_MS', 30_000),
  maxMemoryMb: int('RUNNER_MAX_MEMORY_MB', 1024),
  /** Per-stream cap on captured output; the rest is discarded. */
  maxOutputBytes: int('RUNNER_MAX_OUTPUT_BYTES', 64 * 1024),
  images: {
    rust: process.env.SANDBOX_IMAGE_RUST ?? 'mettle-sandbox-rust:1',
    python: process.env.SANDBOX_IMAGE_PYTHON ?? 'mettle-sandbox-python:1',
    bash: process.env.SANDBOX_IMAGE_BASH ?? 'mettle-sandbox-bash:1',
    cpp: process.env.SANDBOX_IMAGE_CPP ?? 'mettle-sandbox-cpp:1',
    csharp: process.env.SANDBOX_IMAGE_CSHARP ?? 'mettle-sandbox-csharp:1',
    yaml: process.env.SANDBOX_IMAGE_YAML ?? 'mettle-sandbox-yaml:1',
  },
} as const;
