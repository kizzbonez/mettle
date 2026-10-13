import { defineConfig } from 'vitest/config';

// Sandbox tests start real containers. They need a Docker daemon and the
// sandbox images (`npm run sandbox:build`). Run with `npm run test:sandbox`.
export default defineConfig({
  test: {
    include: ['apps/runner/src/**/*.integration.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    env: { RUNNER_TOKEN: 'sandbox-test-token' },
  },
});
