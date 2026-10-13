import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema/identity';
import { conflict, forbidden } from '../../lib/errors';
import { hashPassword } from '../../lib/passwords';
import { displayNameField, emailField, parse, passwordField, withConfirmation } from '../../lib/validate';
import { sendEmailInBackground } from '../email/send';
import { welcomeEmail } from '../email/templates';
import { getSite } from '../settings/site';
import { startSession } from './sessions';
import { publicUser } from './users';

const body = withConfirmation(
  z.object({
    displayName: displayNameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  }),
);

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const site = await getSite();
  if (!site.registrationOpen) throw forbidden('Registration is closed. Ask an administrator for an account.', 'registration_closed');

  const input = parse(body, request.body);
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
      lastLoginAt: new Date(),
      lastSeenAt: new Date(),
    })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (!user) throw conflict('An account with this email already exists. Sign in instead.', 'email_taken');

  sendEmailInBackground({ email: user.email, userId: user.id }, 'welcome', welcomeEmail(site.name, user.displayName));
  await startSession(user, request, reply);
  return reply.code(201).send({ user: publicUser(user) });
}
