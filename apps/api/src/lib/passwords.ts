import bcrypt from 'bcryptjs';

const COST = 12;

/** A hash of a random value, compared against when the account does not exist. */
const DUMMY_HASH = bcrypt.hashSync('mettle-timing-equalizer', COST);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Spends the same time as a real check, so a missing account is not faster to reject. */
export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}
