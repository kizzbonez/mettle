import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { forbidden, HttpError, tooManyRequests } from '../../lib/errors';
import { burnPasswordCheck, verifyPassword } from '../../lib/passwords';
import { emailField, parse } from '../../lib/validate';
import { lockedForSeconds, recordFailedLogin, recordSuccessfulLogin } from './lockout';
import { checkSecondFactor } from './second-factor';
import { startSession } from './sessions';
import { findUserByEmail, publicUser, type UserRow } from './users';

const body = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password.').max(200),
  /** Authenticator code or a recovery code. Only needed when two-factor is on. */
  code: z.string().trim().max(40).optional(),
});

// The same message whether the email or the password was wrong.
const invalidCredentials = () =>
  new HttpError(401, 'invalid_credentials', 'That email and password do not match an account.');

function assertNotLocked(user: UserRow): void {
  const seconds = lockedForSeconds(user);
  if (seconds === 0) return;
  const wait = seconds > 90 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconds`;
  throw tooManyRequests(`Too many failed attempts. Try again in ${wait}.`, 'locked');
}

async function assertSecondFactor(user: UserRow, code: string | undefined): Promise<void> {
  if (!user.totpEnabledAt) return;
  if (!code) {
    throw new HttpError(401, 'totp_required', 'Enter the 6-digit code from your authenticator app.');
  }
  if (await checkSecondFactor(user, code)) return;
  await recordFailedLogin(user);
  throw new HttpError(401, 'totp_invalid', 'That code is not valid. Check your authenticator app and try again.');
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(body, request.body);
  const user = await findUserByEmail(input.email);
  if (!user) {
    await burnPasswordCheck(input.password);
    throw invalidCredentials();
  }
  assertNotLocked(user);
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    await recordFailedLogin(user);
    throw invalidCredentials();
  }
  if (user.status === 'banned') throw forbidden('This account has been suspended.', 'banned');
  await assertSecondFactor(user, input.code);

  await recordSuccessfulLogin(user.id);
  await startSession(user, request, reply);
  return { user: publicUser(user) };
}
