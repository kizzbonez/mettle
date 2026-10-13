import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { authTokens, users } from '../../db/schema/identity';
import { randomToken, sha256 } from '../../lib/crypto';
import { badRequest } from '../../lib/errors';
import { hashPassword } from '../../lib/passwords';
import { emailField, parse, passwordField, withConfirmation } from '../../lib/validate';
import { sendEmailInBackground } from '../email/send';
import { passwordChangedEmail, passwordResetEmail } from '../email/templates';
import { getSite } from '../settings/site';
import { revokeAllSessions } from './sessions';
import { findUserByEmail } from './users';

const RESET_TTL_MS = 60 * 60_000;
/** At most one reset email per account in this window, so the form cannot flood an inbox. */
const RESEND_AFTER_MS = 2 * 60_000;

const forgotBody = z.object({ email: emailField });
const resetBody = withConfirmation(
  z.object({ token: z.string().min(20).max(200), password: passwordField, confirmPassword: z.string() }),
);

/**
 * True when a reset email went to this account moments ago. The limit is per
 * account, not per address, because the address is whatever a proxy reports.
 */
async function sentRecently(userId: string): Promise<boolean> {
  const [latest] = await db
    .select({ createdAt: authTokens.createdAt })
    .from(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, 'password_reset')))
    .orderBy(desc(authTokens.createdAt))
    .limit(1);
  return latest !== undefined && Date.now() - latest.createdAt.getTime() < RESEND_AFTER_MS;
}

/** Always answers the same way, so the form cannot be used to discover accounts. */
export async function forgotPassword(request: FastifyRequest) {
  const { email } = parse(forgotBody, request.body);
  const user = await findUserByEmail(email);
  if (user && user.status === 'active' && !(await sentRecently(user.id))) {
    const token = randomToken();
    await db.transaction(async (tx) => {
      // A new request retires any link sent earlier.
      await tx.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.userId, user.id), isNull(authTokens.usedAt)));
      await tx.insert(authTokens).values({
        userId: user.id,
        purpose: 'password_reset',
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      });
    });
    const site = await getSite();
    const content = passwordResetEmail(site.name, user.displayName, token);
    sendEmailInBackground({ email: user.email, userId: user.id }, 'password_reset', content);
  }
  return { ok: true };
}

export async function resetPassword(request: FastifyRequest) {
  const input = parse(resetBody, request.body);
  const passwordHash = await hashPassword(input.password);
  const user = await db.transaction(async (tx) => {
    // Claiming the token and using it are one statement, so a link cannot be used twice.
    const [claimed] = await tx
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(authTokens.tokenHash, sha256(input.token)),
          eq(authTokens.purpose, 'password_reset'),
          isNull(authTokens.usedAt),
          gt(authTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: authTokens.userId });
    if (!claimed) return null;
    const [updated] = await tx
      .update(users)
      .set({ passwordHash, failedLogins: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(users.id, claimed.userId))
      .returning();
    return updated ?? null;
  });
  if (!user) throw badRequest('This reset link is invalid or has expired. Request a new one.', 'reset_token_invalid');

  await revokeAllSessions(user.id);
  const site = await getSite();
  sendEmailInBackground({ email: user.email, userId: user.id }, 'password_changed', passwordChangedEmail(site.name, user.displayName));
  return { ok: true };
}
