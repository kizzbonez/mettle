import { describe, expect, it } from 'vitest';
import { base32Decode, base32Encode, generateTotpSecret, otpauthUri, totpAt, verifyTotp } from './totp';

// RFC 6238, appendix B. The reference secret is the ASCII string below.
const SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('totpAt', () => {
  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('matches the RFC 6238 vector at t=%i', (seconds, expected) => {
    expect(totpAt(SECRET, seconds * 1000)).toBe(expected);
  });
});

describe('verifyTotp', () => {
  const now = 1234567890 * 1000;

  it('accepts the current code and the neighboring steps', () => {
    expect(verifyTotp(SECRET, totpAt(SECRET, now), now)).toBe(true);
    expect(verifyTotp(SECRET, totpAt(SECRET, now - 30_000), now)).toBe(true);
    expect(verifyTotp(SECRET, totpAt(SECRET, now + 30_000), now)).toBe(true);
  });

  it('rejects a code from two steps away', () => {
    expect(verifyTotp(SECRET, totpAt(SECRET, now - 60_000), now)).toBe(false);
  });

  it('rejects anything that is not six digits', () => {
    expect(verifyTotp(SECRET, '12345', now)).toBe(false);
    expect(verifyTotp(SECRET, 'abcdef', now)).toBe(false);
  });

  it('ignores spaces the user typed', () => {
    const code = totpAt(SECRET, now);
    expect(verifyTotp(SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, now)).toBe(true);
  });
});

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 17]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it('encodes the RFC 4648 example', () => {
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
  });

  it('generates 160-bit secrets', () => {
    expect(base32Decode(generateTotpSecret()).length).toBe(20);
  });
});

describe('otpauthUri', () => {
  it('builds a URI authenticator apps accept', () => {
    const uri = otpauthUri('ABC234', 'ada@example.com', 'Mettle');
    expect(uri).toBe(
      'otpauth://totp/Mettle:ada%40example.com?secret=ABC234&issuer=Mettle&algorithm=SHA1&digits=6&period=30',
    );
  });
});
