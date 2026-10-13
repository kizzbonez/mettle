import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { env } from '../config/env';

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 });
export const db = drizzle(pool);

export type Db = typeof db;
/** A transaction handle; accepted anywhere a `Db` is, so helpers work in both. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: env.MIGRATIONS_DIR });
}
