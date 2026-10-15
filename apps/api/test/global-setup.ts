import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { devEnv } from '../../../scripts/dev-env.mjs';

/** The tests' own small track, so changes to the shipped curriculum never change what they see. */
const FIXTURE_CONTENT = fileURLToPath(new URL('./content', import.meta.url));

/** Recreates the test database, applies the migrations and loads one small track. */
export default async function setup(): Promise<void> {
  const env = devEnv('mettle_test');
  const admin = new pg.Client({ connectionString: env.DATABASE_URL.replace(/\/mettle_test$/, '/postgres') });
  await admin.connect();
  await admin.query('DROP DATABASE IF EXISTS mettle_test WITH (FORCE)');
  await admin.query('CREATE DATABASE mettle_test');
  await admin.end();

  Object.assign(process.env, env, { NODE_ENV: 'test' });
  const { pool, runMigrations } = await import('../src/db/client');
  const { seedContent } = await import('../src/content/seed');
  await runMigrations();
  await seedContent(FIXTURE_CONTENT);
  await pool.end();
}
