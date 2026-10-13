import type { Role } from '@mettle/shared';
import type { FastifyInstance } from 'fastify';
import { db } from '../src/db/client';
import { users } from '../src/db/schema/identity';
import { encrypt } from '../src/lib/crypto';
import { hashPassword } from '../src/lib/passwords';
import { generateTotpSecret, totpAt } from '../src/lib/totp';
import { PASSWORD, TestClient, uniqueEmail } from './client';

/** Inserts a staff account with two-factor already on, and signs it in. */
export async function signInStaff(app: FastifyInstance, role: Exclude<Role, 'learner'>) {
  const email = uniqueEmail(role);
  const secret = generateTotpSecret();
  const [user] = await db
    .insert(users)
    .values({
      email,
      displayName: role === 'admin' ? 'Test Admin' : 'Test Instructor',
      passwordHash: await hashPassword(PASSWORD),
      role,
      totpSecret: encrypt(secret),
      totpEnabledAt: new Date(),
    })
    .returning({ id: users.id });
  const client = new TestClient(app);
  const response = await client.post('/auth/login', { email, password: PASSWORD, code: totpAt(secret, Date.now()) });
  if (response.status !== 200) throw new Error(`staff sign-in failed: ${JSON.stringify(response.body)}`);
  return { client, email, userId: user?.id ?? '' };
}
