import type { Role } from '@mettle/shared';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema/identity';

export type UserRow = typeof users.$inferSelect;

/** The signed-in user as request handlers see it. */
export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  sessionId: string;
  totpEnabled: boolean;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/** What the browser is allowed to know about the signed-in account. */
export function publicUser(user: Pick<UserRow, 'id' | 'email' | 'displayName' | 'role' | 'totpEnabledAt'>) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    totpEnabled: user.totpEnabledAt !== null,
    /** Administrators cannot use the admin panel until they enroll. */
    mustEnrollTotp: user.role === 'admin' && user.totpEnabledAt === null,
  };
}
