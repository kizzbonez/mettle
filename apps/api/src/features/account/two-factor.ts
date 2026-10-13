import { eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import QRCode from 'qrcode';
import { z } from 'zod';
import { db } from '../../db/client';
import { recoveryCodes, users } from '../../db/schema/identity';
import { decrypt, encrypt } from '../../lib/crypto';
import { badRequest, conflict, forbidden, unauthorized } from '../../lib/errors';
import { verifyPassword } from '../../lib/passwords';
import { generateTotpSecret, otpauthUri, verifyTotp } from '../../lib/totp';
import { parse } from '../../lib/validate';
import { me } from '../../plugins/auth';
import { audit } from '../audit/log';
import { checkSecondFactor, issueRecoveryCodes } from '../auth/second-factor';
import { findUserById } from '../auth/users';
import { getSite } from '../settings/site';

const codeBody = z.object({ code: z.string().trim().min(6).max(40) });
const passwordBody = z.object({ password: z.string().min(1).max(200) });

const alreadyOn = () => conflict('Two-factor authentication is already on.', 'totp_already_enabled');

/** What the browser needs to show an enrollment QR code. */
export async function enrollmentPayload(secret: string, account: string) {
  const uri = otpauthUri(secret, account, (await getSite()).name);
  return { secret, uri, qrSvg: await QRCode.toString(uri, { type: 'svg', margin: 1 }) };
}

async function requireUser(request: FastifyRequest) {
  const user = await findUserById(me(request).id);
  if (!user) throw unauthorized();
  return user;
}

/** Step 1: create a secret. It is stored but inactive until a code proves the app has it. */
async function beginEnrollment(request: FastifyRequest) {
  const user = await requireUser(request);
  if (user.totpEnabledAt) throw alreadyOn();
  const secret = generateTotpSecret();
  await db.update(users).set({ totpSecret: encrypt(secret) }).where(eq(users.id, user.id));
  return enrollmentPayload(secret, user.email);
}

/** Step 2: prove it, turn it on, and hand over recovery codes exactly once. */
async function finishEnrollment(request: FastifyRequest) {
  const { code } = parse(codeBody, request.body);
  const user = await requireUser(request);
  if (user.totpEnabledAt) throw alreadyOn();
  if (!user.totpSecret || !verifyTotp(decrypt(user.totpSecret), code)) {
    throw badRequest('That code is not valid. Check your authenticator app and try again.', 'totp_invalid');
  }
  const codes = await db.transaction(async (tx) => {
    await tx.update(users).set({ totpEnabledAt: new Date() }).where(eq(users.id, user.id));
    return issueRecoveryCodes(user.id, tx);
  });
  await audit(request, { action: 'account.2fa_enabled', targetType: 'user', targetId: user.id });
  return { recoveryCodes: codes };
}

async function disable(request: FastifyRequest) {
  const input = parse(codeBody.extend(passwordBody.shape), request.body);
  const user = await requireUser(request);
  if (user.role === 'admin') {
    throw forbidden('Administrators must keep two-factor authentication on.', 'totp_required_for_admin');
  }
  const ok = (await verifyPassword(input.password, user.passwordHash)) && (await checkSecondFactor(user, input.code));
  if (!ok) throw badRequest('The password or the code is not correct.', 'totp_invalid');
  await db.transaction(async (tx) => {
    await tx.update(users).set({ totpSecret: null, totpEnabledAt: null }).where(eq(users.id, user.id));
    await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, user.id));
  });
  await audit(request, { action: 'account.2fa_disabled', targetType: 'user', targetId: user.id });
  return { ok: true };
}

async function regenerateRecoveryCodes(request: FastifyRequest) {
  const { password } = parse(passwordBody, request.body);
  const user = await requireUser(request);
  if (!user.totpEnabledAt) throw badRequest('Turn on two-factor authentication first.', 'totp_not_enabled');
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw badRequest('That password is not correct.', 'invalid_password');
  }
  return { recoveryCodes: await issueRecoveryCodes(user.id) };
}

export async function twoFactorRoutes(app: FastifyInstance): Promise<void> {
  app.post('/account/2fa/setup', beginEnrollment);
  app.post('/account/2fa/enable', finishEnrollment);
  app.post('/account/2fa/disable', disable);
  app.post('/account/2fa/recovery-codes', regenerateRecoveryCodes);
}
