import { defineConfig } from 'vitest/config';

// Unit tests: no Docker, no database. `npm test` runs these.
export default defineConfig({
  test: {
    include: ['apps/*/src/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    env: {
      RUNNER_TOKEN: 'unit-test-token',
      JWT_SECRET: 'unit-test-secret-unit-test-secret-0000',
      DATA_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
      DATABASE_URL: 'postgres://unused:unused@localhost:5432/unused',
      PUBLIC_ORIGIN: 'http://localhost:4310',
    },
  },
});
