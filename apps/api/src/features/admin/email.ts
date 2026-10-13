import { count, desc, inArray } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema/identity';
import { emailLog } from '../../db/schema/system';
import { badRequest } from '../../lib/errors';
import { listQuery, offsetOf, toPage } from '../../lib/listing';
import { parse } from '../../lib/validate';
import { audit } from '../audit/log';
import { sendEmail } from '../email/send';
import { adminMessageEmail } from '../email/templates';
import { getSite, saveSite, siteSettings } from '../settings/site';

const MAX_RECIPIENTS = 200;

const messageBody = z.object({
  userIds: z.array(z.uuid()).min(1, 'Choose at least one recipient.').max(MAX_RECIPIENTS),
  subject: z.string().trim().min(3, 'Write a subject.').max(120),
  message: z.string().trim().min(10, 'Write a message.').max(5000),
});

/** Sends one message to the chosen users, one email each, and reports what happened. */
export async function emailUsers(request: FastifyRequest) {
  const input = parse(messageBody, request.body);
  const recipients = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(inArray(users.id, input.userIds));
  if (recipients.length === 0) throw badRequest('None of those users exist.', 'no_recipients');

  const site = await getSite();
  let sent = 0;
  for (const user of recipients) {
    const content = adminMessageEmail(site.name, user.displayName, input.subject, input.message);
    if (await sendEmail({ email: user.email, userId: user.id }, 'admin_message', content)) sent += 1;
  }
  // The subject is recorded; the body is not, since it may be personal.
  await audit(request, { action: 'email.sent', meta: { recipients: recipients.length, sent, subject: input.subject } });
  return { sent, failed: recipients.length - sent };
}

export async function listEmailLog(request: FastifyRequest) {
  const query = parse(listQuery, request.query);
  const [rows, total] = await Promise.all([
    db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(query.pageSize).offset(offsetOf(query)),
    db.select({ n: count() }).from(emailLog),
  ]);
  return toPage(rows, Number(total[0]?.n ?? 0), query);
}

export async function getSettings() {
  return { site: await getSite() };
}

export async function updateSettings(request: FastifyRequest) {
  const site = parse(siteSettings, request.body);
  await saveSite(site);
  await audit(request, { action: 'settings.updated', meta: { registrationOpen: site.registrationOpen } });
  return { site };
}
