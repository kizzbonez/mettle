import { z } from 'zod';
import { db, type DbOrTx } from '../../db/client';
import { readSetting, writeSetting } from './store';

export const siteSettings = z.object({
  name: z.string().trim().min(1).max(40).default('Mettle'),
  /** When false, only an administrator can create accounts. */
  registrationOpen: z.boolean().default(true),
});

export type SiteSettings = z.infer<typeof siteSettings>;

const SITE_KEY = 'site';
const SETUP_KEY = 'setup';

export async function getSite(): Promise<SiteSettings> {
  return siteSettings.parse((await readSetting(SITE_KEY)) ?? {});
}

export async function saveSite(value: SiteSettings, tx: DbOrTx = db): Promise<void> {
  await writeSetting(SITE_KEY, value, tx);
}

export async function isSetupComplete(): Promise<boolean> {
  return (await readSetting(SETUP_KEY)) !== null;
}

export async function markSetupComplete(tx: DbOrTx = db): Promise<void> {
  await writeSetting(SETUP_KEY, { completedAt: new Date().toISOString() }, tx);
}
