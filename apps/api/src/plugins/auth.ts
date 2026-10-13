import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { db } from '../db/client';
import { sessions, users } from '../db/schema/identity';
import { ACCESS_COOKIE } from '../features/auth/cookies';
import type { CurrentUser } from '../features/auth/users';
import { forbidden, unauthorized } from '../lib/errors';
import { verifyAccessToken } from '../lib/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: CurrentUser | null;
  }
}

const LAST_SEEN_INTERVAL_MS = 5 * 60_000;

/**
 * Verifies the access token, then confirms against the database that the
 * session is still live and the account is still active. That second step is
 * what makes "revoke this session" and "ban this user" take effect at once.
 */
export async function loadCurrentUser(request: FastifyRequest): Promise<CurrentUser | null> {
  const claims = await verifyAccessToken(request.cookies[ACCESS_COOKIE]);
  if (!claims) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      status: users.status,
      totpEnabledAt: users.totpEnabledAt,
      lastSeenAt: users.lastSeenAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, claims.sessionId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.status !== 'active') return null;

  const stale = !row.lastSeenAt || Date.now() - row.lastSeenAt.getTime() > LAST_SEEN_INTERVAL_MS;
  if (stale) await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, row.id));
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    sessionId: claims.sessionId,
    totpEnabled: row.totpEnabledAt !== null,
  };
}

/** preHandler: any signed-in user. */
export async function authenticated(request: FastifyRequest): Promise<void> {
  request.currentUser = await loadCurrentUser(request);
  if (!request.currentUser) throw unauthorized();
}

function requireSecondFactor(user: CurrentUser): void {
  if (user.role === 'admin' && !user.totpEnabled) {
    throw forbidden('Set up two-factor authentication to use the admin panel.', 'two_factor_required');
  }
}

/** preHandler: instructors and administrators (content management). */
export async function staffOnly(request: FastifyRequest): Promise<void> {
  await authenticated(request);
  const user = me(request);
  if (user.role === 'learner') throw forbidden();
  requireSecondFactor(user);
}

/** preHandler: administrators only (users, settings, email). */
export async function adminOnly(request: FastifyRequest): Promise<void> {
  await authenticated(request);
  const user = me(request);
  if (user.role !== 'admin') throw forbidden();
  requireSecondFactor(user);
}

/** The signed-in user, inside a route guarded by one of the preHandlers above. */
export function me(request: FastifyRequest): CurrentUser {
  if (!request.currentUser) throw unauthorized();
  return request.currentUser;
}
