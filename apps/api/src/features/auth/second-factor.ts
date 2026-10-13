import { randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db, type DbOrTx } from '../../db/client';
import { recoveryCodes } from '../../db/schema/identity';
import { decrypt, sha256 } from '../../lib/crypto';
import { verifyTotp } from '../../lib/totp';
import type { UserRow } from './users';

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no look-alikes

function recoveryCode(): string {
  const chars = Array.from(randomBytes(12), (byte) => RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8).join('')}`;
}

const normalize = (code: string) => code.trim().toLowerCase();

/** Replaces the user's recovery codes and returns the new ones, shown exactly once. */
export async function issueRecoveryCodes(userId: string, tx: DbOrTx = db): Promise<string[]> {
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, recoveryCode);
  await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
  await tx.insert(recoveryCodes).values(codes.map((code) => ({ userId, codeHash: sha256(code) })));
  return codes;
}

async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const used = await db
    .update(recoveryCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(recoveryCodes.userId, userId),
        eq(recoveryCodes.codeHash, sha256(normalize(code))),
        isNull(recoveryCodes.usedAt),
      ),
    )
    .returning({ id: recoveryCodes.id });
  return used.length > 0;
}

/** Accepts a current authenticator code, or an unused recovery code (which is then spent). */
export async function checkSecondFactor(
  user: Pick<UserRow, 'id' | 'totpSecret'>,
  code: string,
): Promise<boolean> {
  if (!user.totpSecret) return false;
  if (/^\d{6}$/.test(code.replace(/\s/g, ''))) return verifyTotp(decrypt(user.totpSecret), code);
  return consumeRecoveryCode(user.id, code);
}
