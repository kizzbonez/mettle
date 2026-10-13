import type { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env';
import { db } from '../../db/client';
import { users } from '../../db/schema/identity';
import { encrypt, randomToken, safeEqual } from '../../lib/crypto';
import { badRequest, conflict, unauthorized } from '../../lib/errors';
import { hashPassword } from '../../lib/passwords';
import { generateTotpSecret, verifyTotp } from '../../lib/totp';
import { displayNameField, emailField, parse, passwordField, withConfirmation } from '../../lib/validate';
import { enrollmentPayload } from '../account/two-factor';
import { issueRecoveryCodes } from '../auth/second-factor';
import { startSession } from '../auth/sessions';
import { publicUser } from '../auth/users';
import { isSetupComplete, markSetupComplete, saveSite } from '../settings/site';

/**
 * A new install has no accounts, so the first visitor could otherwise claim
 * it. The wizard only works with this token, which is printed to the API log
 * and so is only available to whoever operates the server.
 */
let setupToken: string | null = null;

export async function announceSetupToken(log: FastifyBaseLogger): Promise<void> {
  if (await isSetupComplete()) return;
  setupToken = env.SETUP_TOKEN ?? randomToken(18);
  log.info(`\n\n  Mettle is not set up yet.\n  Open the site and enter this one-time setup token:\n\n      ${setupToken}\n`);
}

const tokenBody = z.object({ token: z.string().min(1).max(100) });
const totpBody = tokenBody.extend({ email: emailField });
const completeBody = withConfirmation(
  tokenBody.extend({
    displayName: displayNameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
    totpSecret: z.string().regex(/^[A-Z2-7]{32}$/),
    totpCode: z.string().trim().min(6).max(10),
    siteName: z.string().trim().min(1).max(40),
    registrationOpen: z.boolean(),
  }),
);

type CompleteInput = z.infer<typeof completeBody>;

async function assertToken(candidate: string): Promise<void> {
  if (await isSetupComplete()) throw conflict('Setup has already been completed.', 'setup_done');
  if (!setupToken || !safeEqual(candidate.trim(), setupToken)) {
    throw unauthorized('That setup token is not correct. Copy it from the API log.', 'setup_token_invalid');
  }
}

async function verifyToken(request: FastifyRequest) {
  await assertToken(parse(tokenBody, request.body).token);
  return { ok: true };
}

async function previewTotp(request: FastifyRequest) {
  const input = parse(totpBody, request.body);
  await assertToken(input.token);
  return enrollmentPayload(generateTotpSecret(), input.email);
}

/** The first administrator, the site settings and the "setup done" marker, all or nothing. */
async function createInstall(input: CompleteInput) {
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async (tx) => {
    const [admin] = await tx
      .insert(users)
      .values({
        email: input.email,
        displayName: input.displayName,
        passwordHash,
        role: 'admin',
        totpSecret: encrypt(input.totpSecret),
        totpEnabledAt: new Date(),
        lastLoginAt: new Date(),
        lastSeenAt: new Date(),
      })
      .returning();
    if (!admin) throw new Error('Could not create the administrator');
    await saveSite({ name: input.siteName, registrationOpen: input.registrationOpen }, tx);
    await markSetupComplete(tx);
    return { admin, recoveryCodes: await issueRecoveryCodes(admin.id, tx) };
  });
}

async function completeSetup(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(completeBody, request.body);
  await assertToken(input.token);
  if (!verifyTotp(input.totpSecret, input.totpCode)) {
    const fields = { totpCode: 'This code is not valid.' };
    throw badRequest('That code is not valid. Check your authenticator app and try again.', 'totp_invalid', { fields });
  }
  const result = await createInstall(input);
  setupToken = null;
  await startSession(result.admin, request, reply);
  return reply.code(201).send({ user: publicUser(result.admin), recoveryCodes: result.recoveryCodes });
}

export async function setupRoutes(app: FastifyInstance): Promise<void> {
  const strict = { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } };
  app.get('/setup/status', async () => ({ needed: !(await isSetupComplete()) }));
  app.post('/setup/verify', strict, verifyToken);
  app.post('/setup/totp', strict, previewTotp);
  app.post('/setup/complete', strict, completeSetup);
}
