import { defineConfig } from 'vitest/config';
import { devEnv } from './scripts/dev-env.mjs';

// API tests drive the real Fastify app against a real PostgreSQL database
// (`mettle_test`, recreated on every run) and the real sandbox runner.
// Start the services first:  npm run dev:services
const dev = devEnv('mettle_test');
const keys = [
  'DATABASE_URL', 'MIGRATIONS_DIR', 'CONTENT_DIR', 'RUNNER_URL', 'RUNNER_TOKEN', 'JWT_SECRET', 'DATA_KEY',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'PUBLIC_ORIGIN',
] as const;

export default defineConfig({
  test: {
    include: ['apps/api/src/**/*.api.test.ts'],
    globalSetup: ['apps/api/test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      ...Object.fromEntries(keys.map((key) => [key, dev[key] ?? ''])),
      NODE_ENV: 'test',
      RATE_LIMITS: 'false',
      SEED_CONTENT: 'false',
      SETUP_TOKEN: 'test-setup-token-0123456789',
    },
  },
});
