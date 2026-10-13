import { createHmac, randomBytes } from 'node:crypto';
import { safeEqual } from './crypto';

/** Time-based one-time passwords (RFC 6238): HMAC-SHA1, 6 digits, 30-second steps. */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_MS = 30_000;

export function base32Encode(data: Buffer): string {
  let bits = '';
  for (const byte of data) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += ALPHABET[Number.parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  }
  return out;
}

export function base32Decode(text: string): Buffer {
  let bits = '';
  for (const char of text.toUpperCase().replace(/=+$/, '')) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) throw new Error('Invalid base32');
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpAt(secret: string, timeMs: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timeMs / STEP_MS)));
  const mac = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = (mac.at(-1) ?? 0) & 0x0f;
  const binary = mac.readUInt32BE(offset) & 0x7fffffff;
  return (binary % 1_000_000).toString().padStart(6, '0');
}

/** Accepts the current step and one either side, to tolerate clock drift. */
export function verifyTotp(secret: string, code: string, nowMs = Date.now()): boolean {
  const candidate = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(candidate)) return false;
  return [-1, 0, 1].some((drift) => safeEqual(totpAt(secret, nowMs + drift * STEP_MS), candidate));
}

export function otpauthUri(secret: string, account: string, issuer: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}
