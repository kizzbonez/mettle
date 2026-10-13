import { and, eq, isNull, ne } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../db/client';
import { sessions, users } from '../../db/schema/identity';
import { randomToken, safeEqual, sha256 } from '../../lib/crypto';
import { signAccessToken } from '../../lib/jwt';
import { REFRESH_COOKIE, REFRESH_TTL_SECONDS, setAccessCookie, setSessionCookies } from './cookies';
import type { UserRow } from './users';

const expiry = () => new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

/** Creates a session row and sets the cookies for it. */
export async function startSession(
  user: Pick<UserRow, 'id' | 'role'>,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const secret = randomToken();
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      tokenHash: sha256(secret),
      userAgent: request.headers['user-agent']?.slice(0, 300) ?? null,
      ip: request.ip,
      expiresAt: expiry(),
    })
    .returning({ id: sessions.id });
  if (!session) throw new Error('Could not create a session');
  const access = await signAccessToken({ userId: user.id, sessionId: session.id, role: user.role });
  setSessionCookies(reply, access, `${session.id}.${secret}`);
}

/**
 * Exchanges a valid refresh token for a new access token. The session row is
 * the source of truth: revoked, expired, or belonging to a banned user all fail.
 */
export async function refreshSession(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const [sessionId, secret] = (request.cookies[REFRESH_COOKIE] ?? '').split('.');
  if (!sessionId || !secret || !/^[0-9a-f-]{36}$/.test(sessionId)) return false;
  const [row] = await db
    .select({ session: sessions, role: users.role, status: users.status })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!row || row.session.revokedAt || row.session.expiresAt < new Date()) return false;
  if (row.status !== 'active' || !safeEqual(row.session.tokenHash, sha256(secret))) return false;

  await db.update(sessions).set({ lastUsedAt: new Date(), expiresAt: expiry() }).where(eq(sessions.id, sessionId));
  const access = await signAccessToken({ userId: row.session.userId, sessionId, role: row.role });
  setAccessCookie(reply, access);
  return true;
}

export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  const revoked = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  return revoked.length > 0;
}

/** Signs the user out everywhere, optionally keeping the session making the request. */
export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
  const mine = and(eq(sessions.userId, userId), isNull(sessions.revokedAt));
  const filter = exceptSessionId ? and(mine, ne(sessions.id, exceptSessionId)) : mine;
  await db.update(sessions).set({ revokedAt: new Date() }).where(filter);
}
