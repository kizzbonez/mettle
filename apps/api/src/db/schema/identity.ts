import { index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { createdAt, id, ts, updatedAt } from './columns';
import { tokenPurpose, userRole, userStatus } from './enums';

export const users = pgTable(
  'users',
  {
    id: id(),
    /** Stored lower-cased; uniqueness is enforced on the stored value. */
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('learner'),
    status: userStatus('status').notNull().default('active'),
    banReason: text('ban_reason'),
    /** AES-256-GCM ciphertext of the TOTP secret; null until enrollment starts. */
    totpSecret: text('totp_secret'),
    totpEnabledAt: ts('totp_enabled_at'),
    failedLogins: integer('failed_logins').notNull().default(0),
    lockedUntil: ts('locked_until'),
    lastLoginAt: ts('last_login_at'),
    lastSeenAt: ts('last_seen_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    index('users_role_status_idx').on(t.role, t.status),
    index('users_created_idx').on(t.createdAt),
    index('users_last_seen_idx').on(t.lastSeenAt),
  ],
);

/** One row per signed-in device. The refresh token is stored only as a hash. */
export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: createdAt(),
    lastUsedAt: ts('last_used_at').notNull().defaultNow(),
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const recoveryCodes = pgTable(
  'recovery_codes',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    usedAt: ts('used_at'),
    createdAt: createdAt(),
  },
  (t) => [index('recovery_codes_user_idx').on(t.userId)],
);

/** Single-use, expiring tokens sent by email. Only the hash is stored. */
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: tokenPurpose('purpose').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('auth_tokens_hash_key').on(t.tokenHash),
    index('auth_tokens_user_idx').on(t.userId),
  ],
);
