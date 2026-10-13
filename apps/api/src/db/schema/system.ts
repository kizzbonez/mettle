import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './columns';
import { emailStatus } from './enums';
import { users } from './identity';

/** Platform settings as key/value documents (site name, registration, setup state). */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export const emailLog = pgTable(
  'email_log',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    toEmail: text('to_email').notNull(),
    template: text('template').notNull(),
    subject: text('subject').notNull(),
    status: emailStatus('status').notNull(),
    error: text('error'),
    createdAt: createdAt(),
  },
  (t) => [index('email_log_created_idx').on(t.createdAt)],
);

/** Who did what in the admin panel and the account security pages. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    ip: text('ip'),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt), index('audit_log_actor_idx').on(t.actorId)],
);
