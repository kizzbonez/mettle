import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, randomToken, safeEqual, sha256 } from './crypto';

describe('encrypt / decrypt', () => {
  it('round-trips text, including non-ASCII', () => {
    for (const text of ['JBSWY3DPEHPK3PXP', '', 'naïve café ☕']) expect(decrypt(encrypt(text))).toBe(text);
  });

  it('produces different ciphertext each time for the same input', () => {
    expect(encrypt('same secret')).not.toBe(encrypt('same secret'));
  });

  it('refuses ciphertext that was altered', () => {
    const raw = Buffer.from(encrypt('JBSWY3DPEHPK3PXP'), 'base64');
    const last = raw.length - 1;
    raw[last] = (raw[last] ?? 0) ^ 0x01;
    expect(() => decrypt(raw.toString('base64'))).toThrow();
  });

  it('refuses an authentication tag that was altered', () => {
    const raw = Buffer.from(encrypt('JBSWY3DPEHPK3PXP'), 'base64');
    raw[12] = (raw[12] ?? 0) ^ 0x01; // first byte of the tag, after the 12-byte IV
    expect(() => decrypt(raw.toString('base64'))).toThrow();
  });

  it('refuses a message too short to hold a full tag', () => {
    // 12-byte IV plus only 4 bytes where the 16-byte tag should be.
    const truncated = Buffer.from(encrypt(''), 'base64').subarray(0, 16);
    expect(() => decrypt(truncated.toString('base64'))).toThrow();
  });
});

describe('helpers', () => {
  it('hashes to 64 hex characters, deterministically', () => {
    expect(sha256('token')).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256('token')).toBe(sha256('token'));
    expect(sha256('token')).not.toBe(sha256('Token'));
  });

  it('makes URL-safe tokens that do not repeat', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => randomToken()));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('compares strings without leaking where they differ', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
