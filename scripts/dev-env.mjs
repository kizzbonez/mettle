// Environment for running the API on the host against the services started by
// docker-compose.dev.yml (database, runner and mailbox on loopback ports).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function readDotEnv() {
  const path = `${root}.env`;
  if (!existsSync(path)) throw new Error('No .env found. Run `npm run init:env` first.');
  const values = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (match) values[match[1]] = match[2];
  }
  return values;
}

/** @param {string} database Name of the database to connect to. */
export function devEnv(database = 'mettle') {
  const file = readDotEnv();
  return {
    ...process.env,
    ...file,
    NODE_ENV: 'development',
    // DEV_DB_PORT points the tools at a second stack, such as the one the screenshots are taken from.
    DATABASE_URL: `postgres://mettle:${file.POSTGRES_PASSWORD}@127.0.0.1:${process.env.DEV_DB_PORT ?? '54329'}/${database}`,
    MIGRATIONS_DIR: `${root}apps/api/migrations`,
    CONTENT_DIR: `${root}content`,
    RUNNER_URL: 'http://127.0.0.1:4101',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: '4326',
    API_HOST: '127.0.0.1',
    API_PORT: '4311',
  };
}
