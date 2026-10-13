import { ROLES } from '@mettle/shared';
import { and, count, eq, ilike, ne, or, type SQL } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema/identity';
import { conflict, notFound } from '../../lib/errors';
import { uniqueOrConflict } from '../../lib/db-errors';
import { containsPattern, listQuery, offsetOf, orderOf, toPage } from '../../lib/listing';
import { hashPassword } from '../../lib/passwords';
import { displayNameField, emailField, parse, passwordField, uuidParam } from '../../lib/validate';
import { me } from '../../plugins/auth';
import { audit } from '../audit/log';
import { revokeAllSessions } from '../auth/sessions';
import { sendEmailInBackground } from '../email/send';
import { accountSuspendedEmail } from '../email/templates';
import { recentActivity } from '../progress/activity';
import { learnerStats } from '../progress/learner-stats';
import { getSite } from '../settings/site';

const usersQuery = listQuery.extend({ role: z.enum(ROLES).optional(), status: z.enum(['active', 'banned']).optional() });
const createBody = z.object({ displayName: displayNameField, email: emailField, password: passwordField, role: z.enum(ROLES) });
const updateBody = z.object({ displayName: displayNameField.optional(), role: z.enum(ROLES).optional() });
const banBody = z.object({ reason: z.string().trim().max(300).default('') });

const sortable = {
  createdAt: users.createdAt, lastSeenAt: users.lastSeenAt, email: users.email,
  displayName: users.displayName, role: users.role, status: users.status,
};

/** Never the password hash, the TOTP secret or lockout counters. */
const adminView = {
  id: users.id, email: users.email, displayName: users.displayName, role: users.role, status: users.status,
  banReason: users.banReason, totpEnabledAt: users.totpEnabledAt, lastSeenAt: users.lastSeenAt,
  lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
};

export async function listUsers(request: FastifyRequest) {
  const query = parse(usersQuery, request.query);
  const filters: SQL[] = [];
  if (query.role) filters.push(eq(users.role, query.role));
  if (query.status) filters.push(eq(users.status, query.status));
  const search = query.q ? or(ilike(users.email, containsPattern(query.q)), ilike(users.displayName, containsPattern(query.q))) : undefined;
  if (search) filters.push(search);
  const where = filters.length > 0 ? and(...filters) : undefined;
  const [rows, total] = await Promise.all([
    db.select(adminView).from(users).where(where).orderBy(orderOf(sortable, query, 'createdAt')).limit(query.pageSize).offset(offsetOf(query)),
    db.select({ n: count() }).from(users).where(where),
  ]);
  return toPage(rows, Number(total[0]?.n ?? 0), query);
}

async function existingUser(id: string) {
  const [user] = await db.select(adminView).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw notFound('User');
  return user;
}

export async function getUser(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const [user, stats, activity] = await Promise.all([existingUser(id), learnerStats(id), recentActivity(id, 10)]);
  return { user, stats, activity };
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(createBody, request.body);
  const passwordHash = await hashPassword(input.password);
  const [user] = await uniqueOrConflict(
    () => db.insert(users).values({ email: input.email, displayName: input.displayName, role: input.role, passwordHash }).returning(adminView),
    'An account with this email already exists.',
  );
  await audit(request, { action: 'user.created', targetType: 'user', targetId: user?.id, meta: { role: input.role } });
  return reply.code(201).send({ user });
}

async function assertAnotherAdminRemains(exceptId: string): Promise<void> {
  const [row] = await db.select({ n: count() }).from(users).where(and(eq(users.role, 'admin'), eq(users.status, 'active'), ne(users.id, exceptId)));
  if (Number(row?.n ?? 0) === 0) throw conflict('This is the only administrator. Promote someone else first.', 'last_admin');
}

export async function updateUser(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const input = parse(updateBody, request.body);
  const target = await existingUser(id);
  const demoting = target.role === 'admin' && input.role !== undefined && input.role !== 'admin';
  if (demoting && id === me(request).id) throw conflict('You cannot change your own role.', 'self_change');
  if (demoting) await assertAnotherAdminRemains(id);
  const [user] = await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, id)).returning(adminView);
  if (input.role && input.role !== target.role) {
    await audit(request, { action: 'user.role_changed', targetType: 'user', targetId: id, meta: { from: target.role, to: input.role } });
  }
  return { user };
}

export async function banUser(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const { reason } = parse(banBody, request.body);
  if (id === me(request).id) throw conflict('You cannot suspend your own account.', 'self_change');
  const target = await existingUser(id);
  if (target.role === 'admin') await assertAnotherAdminRemains(id);
  const [user] = await db.update(users).set({ status: 'banned', banReason: reason || null, updatedAt: new Date() }).where(eq(users.id, id)).returning(adminView);
  // Their access token would otherwise keep working until it expired.
  await revokeAllSessions(id);
  await audit(request, { action: 'user.banned', targetType: 'user', targetId: id, meta: { reason } });
  sendEmailInBackground({ email: target.email, userId: id }, 'account_suspended', accountSuspendedEmail((await getSite()).name, target.displayName, reason));
  return { user };
}

export async function unbanUser(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  await existingUser(id);
  const [user] = await db.update(users).set({ status: 'active', banReason: null, failedLogins: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, id)).returning(adminView);
  await audit(request, { action: 'user.unbanned', targetType: 'user', targetId: id });
  return { user };
}
