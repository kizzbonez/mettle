import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, type DbOrTx } from '../../db/client';
import { settings } from '../../db/schema/system';

export const siteSettings = z.object({
  name: z.string().trim().min(1).max(40).default('Mettle'),
  /** When false, only an administrator can create accounts. */
  registrationOpen: z.boolean().default(true),
});

export type SiteSettings = z.infer<typeof siteSettings>;

const SITE_KEY = 'site';
const SETUP_KEY = 'setup';

async function read(key: string): Promise<unknown> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? null;
}

async function write(key: string, value: unknown, tx: DbOrTx = db): Promise<void> {
  await tx
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getSite(): Promise<SiteSettings> {
  return siteSettings.parse((await read(SITE_KEY)) ?? {});
}

export async function saveSite(value: SiteSettings, tx: DbOrTx = db): Promise<void> {
  await write(SITE_KEY, value, tx);
}

export async function isSetupComplete(): Promise<boolean> {
  return (await read(SETUP_KEY)) !== null;
}

export async function markSetupComplete(tx: DbOrTx = db): Promise<void> {
  await write(SETUP_KEY, { completedAt: new Date().toISOString() }, tx);
}
