import { buildApp } from './app';
import { env } from './config/env';
import { syncContent } from './content/sync';
import { pool, runMigrations } from './db/client';
import { sweepExpiredAttempts } from './features/exams/finalize';
import { failInterruptedSubmissions } from './features/labs/jobs';
import { announceSetupToken } from './features/setup/routes';

const SWEEP_INTERVAL_MS = 30_000;

async function main(): Promise<void> {
  const app = await buildApp();
  await runMigrations();
  if (env.SEED_CONTENT) {
    // A new install gets the whole curriculum; an upgraded one gets new subjects and revised tracks.
    const { add, update } = await syncContent(env.CONTENT_DIR);
    if (add.length > 0) app.log.info(`Loaded the curriculum: added ${add.join(', ')}.`);
    if (update.length > 0) app.log.info(`Updated the curriculum in place: ${update.join(', ')}.`);
  }
  const interrupted = await failInterruptedSubmissions();
  if (interrupted > 0) app.log.warn(`${interrupted} lab submission(s) were interrupted by the last shutdown.`);

  // Exams whose time ran out while the learner was away still need a grade.
  const sweeper = setInterval(() => {
    sweepExpiredAttempts().catch((error) => app.log.error(error, 'exam sweep failed'));
  }, SWEEP_INTERVAL_MS);
  sweeper.unref();

  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  await announceSetupToken(app.log);

  const shutdown = async () => {
    clearInterval(sweeper);
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
