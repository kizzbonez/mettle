import type { FastifyInstance } from 'fastify';
import { unauthorized } from '../../lib/errors';
import { authenticated, loadCurrentUser, me } from '../../plugins/auth';
import { clearSessionCookies } from './cookies';
import { login } from './login';
import { forgotPassword, resetPassword } from './password-reset';
import { register } from './register';
import { refreshSession, revokeSession } from './sessions';
import { findUserById, publicUser } from './users';

/** Tight per-IP limits on the endpoints an attacker would hammer. */
const limit = (max: number, timeWindow: string) => ({ config: { rateLimit: { max, timeWindow } } });

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', limit(10, '1 hour'), register);
  app.post('/auth/login', limit(20, '5 minutes'), login);
  app.post('/auth/forgot-password', limit(5, '15 minutes'), forgotPassword);
  app.post('/auth/reset-password', limit(10, '15 minutes'), resetPassword);

  app.post('/auth/refresh', limit(60, '1 minute'), async (request, reply) => {
    if (await refreshSession(request, reply)) return { ok: true };
    clearSessionCookies(reply);
    throw unauthorized('Your session has ended. Sign in again.', 'session_expired');
  });

  app.post('/auth/logout', async (request, reply) => {
    const user = await loadCurrentUser(request);
    if (user) await revokeSession(user.id, user.sessionId);
    clearSessionCookies(reply);
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: authenticated }, async (request) => {
    const row = await findUserById(me(request).id);
    if (!row) throw unauthorized();
    return { user: publicUser(row) };
  });
}
