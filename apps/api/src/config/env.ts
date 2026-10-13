import { z } from 'zod';

const flag = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  /**
   * Addresses allowed to speak for a client through X-Forwarded-For: the web
   * app and any tunnel in front of it, which all live on private networks.
   * The client address is the first one, reading right to left, not in this list.
   */
  TRUSTED_PROXIES: z.string().default('loopback,linklocal,uniquelocal'),
  DATABASE_URL: z.string().min(1),
  MIGRATIONS_DIR: z.string().default('migrations'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  DATA_KEY: z
    .string()
    .refine((value) => Buffer.from(value, 'base64').length === 32, 'DATA_KEY must be 32 bytes, base64'),
  PUBLIC_ORIGIN: z.string().url(),
  RUNNER_URL: z.string().default('http://runner:4100'),
  RUNNER_TOKEN: z.string().min(1),
  SMTP_HOST: z.string().default('mailpit'),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_SECURE: flag('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Mettle <noreply@mettle.local>'),
  SEED_CONTENT: flag('true'),
  /** Off only in the automated test suite, which signs in far more often than a person does. */
  RATE_LIMITS: flag('true'),
  /** Fixes the first-run setup token instead of generating one. For automated installs. */
  SETUP_TOKEN: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(16).optional()),
  CONTENT_DIR: z.string().default('content'),
});

function load(): z.infer<typeof schema> {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return parsed.data;
  const lines = parsed.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid configuration:\n${lines.join('\n')}`);
}

export const env = load();
if (!env.RATE_LIMITS && env.NODE_ENV !== 'test') throw new Error('RATE_LIMITS=false is only allowed when NODE_ENV=test');
export const isProduction = env.NODE_ENV === 'production';
export const cookiesAreSecure = env.PUBLIC_ORIGIN.startsWith('https://');
