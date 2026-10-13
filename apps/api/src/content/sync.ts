import { z } from 'zod';
import { db } from '../db/client';
import { tracks } from '../db/schema/catalog';
import { readSetting, writeSetting } from '../features/settings/store';
import { listShippedTracks, type ShippedTrack } from './load';
import { seedContent } from './seed';

const CONTENT_KEY = 'content';
/** The revision of each shipped track this database has been given. */
const contentState = z.object({ tracks: z.record(z.string(), z.number().int()).default({}) });

export interface SyncPlan {
  add: string[];
  update: string[];
}

/**
 * What to do with the shipped tracks when the site starts.
 *
 * - A track this database has never been given, with no track of that slug
 *   here: add it. That is a new install, or an upgrade that brings a subject.
 * - A track that is here and whose shipped revision is newer than the one on
 *   record: update it in place. Lessons, questions and labs are matched by
 *   slug and key, so learners keep their progress.
 * - Anything else is left alone. A shipped track that was deleted here stays
 *   deleted, and nothing a site wrote itself is touched.
 *
 * A track with no record was installed before records were kept: revision 1.
 */
export function planSync(shipped: ShippedTrack[], present: string[], seen: Record<string, number>): SyncPlan {
  const plan: SyncPlan = { add: [], update: [] };
  for (const { slug, revision } of shipped) {
    const here = present.includes(slug);
    if (!here && !Object.hasOwn(seen, slug)) plan.add.push(slug);
    else if (here && revision > (seen[slug] ?? 1)) plan.update.push(slug);
  }
  return plan;
}

/** Brings the database up to date with the shipped curriculum. Runs at every start. */
export async function syncContent(contentDir: string): Promise<SyncPlan> {
  const shipped = listShippedTracks(contentDir);
  const present = (await db.select({ slug: tracks.slug }).from(tracks)).map((row) => row.slug);
  const { tracks: seen } = contentState.parse((await readSetting(CONTENT_KEY)) ?? {});
  const plan = planSync(shipped, present, seen);
  const changed = [...plan.add, ...plan.update];
  if (changed.length > 0) await seedContent(contentDir, changed);
  const given = Object.fromEntries(shipped.map((track) => [track.slug, track.revision]));
  await writeSetting(CONTENT_KEY, { tracks: { ...seen, ...given } });
  return plan;
}
