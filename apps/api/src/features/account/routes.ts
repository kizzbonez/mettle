import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { sessions, users } from '../../db/schema/identity';
import { badRequest, notFound, unauthorized } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/passwords';
import { displayNameField, parse, passwordField, uuidParam, withConfirmation } from '../../lib/validate';
import { authenticated, me } from '../../plugins/auth';
import { audit } from '../audit/log';
import { revokeAllSessions, revokeSession } from '../auth/sessions';
import { findUserById, publicUser } from '../auth/users';
import { sendEmailInBackground } from '../email/send';
import { passwordChangedEmail } from '../email/templates';
import { getSite } from '../settings/site';
import { twoFactorRoutes } from './two-factor';

const profileBody = z.object({ displayName: displayNameField });
const passwordBody = withConfirmation(
  z.object({ currentPassword: z.string().min(1).max(200), password: passwordField, confirmPassword: z.string() }),
);

async function listSessions(userId: string, currentId: string) {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.lastUsedAt));
  return rows.map((row) => ({
    id: row.id,
    userAgent: row.userAgent,
    ip: row.ip,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    current: row.id === currentId,
  }));
}

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticated);
  await app.register(twoFactorRoutes);

  app.patch('/account', async (request) => {
    const { displayName } = parse(profileBody, request.body);
    const [user] = await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, me(request).id)).returning();
    if (!user) throw unauthorized();
    return { user: publicUser(user) };
  });

  app.post('/account/password', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request) => {
    const input = parse(passwordBody, request.body);
    const current = me(request);
    const user = await findUserById(current.id);
    if (!user) throw unauthorized();
    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw badRequest('Your current password is not correct.', 'invalid_password', { fields: { currentPassword: 'This is not your current password.' } });
    }
    await db.update(users).set({ passwordHash: await hashPassword(input.password), updatedAt: new Date() }).where(eq(users.id, user.id));
    // Anyone else holding a session on this account is signed out.
    await revokeAllSessions(user.id, current.sessionId);
    await audit(request, { action: 'account.password_changed', targetType: 'user', targetId: user.id });
    sendEmailInBackground({ email: user.email, userId: user.id }, 'password_changed', passwordChangedEmail((await getSite()).name, user.displayName));
    return { ok: true };
  });

  app.get('/account/sessions', async (request) => {
    const user = me(request);
    return { sessions: await listSessions(user.id, user.sessionId) };
  });

  app.delete('/account/sessions/:id', async (request) => {
    const { id } = parse(uuidParam, request.params);
    if (!(await revokeSession(me(request).id, id))) throw notFound('Session');
    return { ok: true };
  });

  app.post('/account/sessions/revoke-others', async (request) => {
    const user = me(request);
    await revokeAllSessions(user.id, user.sessionId);
    return { ok: true };
  });
}
