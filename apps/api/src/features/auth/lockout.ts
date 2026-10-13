import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema/identity';
import type { UserRow } from './users';

const FREE_ATTEMPTS = 4;
const FIRST_LOCK_MS = 30_000;
const MAX_LOCK_MS = 15 * 60_000;

/**
 * No lock for the first few mistakes, then 30 seconds, doubling with each
 * further failure up to 15 minutes. Slows guessing without letting anyone
 * lock a victim out for long.
 */
export function lockDurationMs(failures: number): number {
  if (failures <= FREE_ATTEMPTS) return 0;
  return Math.min(MAX_LOCK_MS, FIRST_LOCK_MS * 2 ** (failures - FREE_ATTEMPTS - 1));
}

export function lockedForSeconds(user: Pick<UserRow, 'lockedUntil'>, now = Date.now()): number {
  if (!user.lockedUntil) return 0;
  return Math.max(0, Math.ceil((user.lockedUntil.getTime() - now) / 1000));
}

export async function recordFailedLogin(user: Pick<UserRow, 'id' | 'failedLogins'>): Promise<void> {
  const failures = user.failedLogins + 1;
  const lockMs = lockDurationMs(failures);
  await db
    .update(users)
    .set({ failedLogins: failures, lockedUntil: lockMs ? new Date(Date.now() + lockMs) : null })
    .where(eq(users.id, user.id));
}

export async function recordSuccessfulLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date(), lastSeenAt: new Date() })
    .where(eq(users.id, userId));
}
