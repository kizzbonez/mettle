import { eq } from 'drizzle-orm';
import { db, type DbOrTx } from '../../db/client';
import { settings } from '../../db/schema/system';

/** The `settings` table holds one JSON document per key. */

export async function readSetting(key: string): Promise<unknown> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? null;
}

export async function writeSetting(key: string, value: unknown, tx: DbOrTx = db): Promise<void> {
  await tx
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}
