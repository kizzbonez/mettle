import { describe, expect, it } from 'vitest';
import { forwardedFor, isPrivateAddress, normalizeAddress } from '../../server/forwarded-for.mjs';

describe('normalizeAddress', () => {
  it('unwraps an IPv4 address seen through an IPv6 socket', () => {
    expect(normalizeAddress('::ffff:172.18.0.1')).toBe('172.18.0.1');
    expect(normalizeAddress('203.0.113.9')).toBe('203.0.113.9');
    expect(normalizeAddress('2001:DB8::1')).toBe('2001:db8::1');
    expect(normalizeAddress(undefined)).toBe('');
  });
});

describe('isPrivateAddress', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.254', '192.168.65.1', '169.254.1.1', '::1', 'fe80::1', 'fd12:3456::1', '::ffff:192.168.32.4'])(
    'treats %s as a place a proxy can live',
    (address) => {
      expect(isPrivateAddress(address)).toBe(true);
    },
  );

  it.each(['203.0.113.9', '8.8.8.8', '172.32.0.1', '172.15.0.1', '192.169.0.1', '2001:db8::1', '', 'not-an-address', '999.1.1.1'])(
    'treats %j as a client',
    (address) => {
      expect(isPrivateAddress(address)).toBe(false);
    },
  );
});

describe('forwardedFor', () => {
  it('reports the connection address when no proxy is involved', () => {
    expect(forwardedFor(undefined, '203.0.113.9')).toBe('203.0.113.9');
    expect(forwardedFor(undefined, '::ffff:172.18.0.1')).toBe('172.18.0.1');
  });

  it('discards a chain claimed by an untrusted client', () => {
    // A visitor connecting directly, pretending to be someone else.
    expect(forwardedFor('198.51.100.1', '203.0.113.9')).toBe('203.0.113.9');
    expect(forwardedFor('127.0.0.1, 10.0.0.1', '203.0.113.9')).toBe('203.0.113.9');
  });

  it('keeps the chain reported by a trusted proxy and appends the proxy', () => {
    // A tunnel or reverse proxy on the private network, reporting the real visitor.
    expect(forwardedFor('203.0.113.9', '172.18.0.5')).toBe('203.0.113.9, 172.18.0.5');
    expect(forwardedFor(['198.51.100.1', '203.0.113.9'], '127.0.0.1')).toBe('198.51.100.1, 203.0.113.9, 127.0.0.1');
  });

  it('leaves the header alone when the connection has no address', () => {
    expect(forwardedFor('203.0.113.9', undefined)).toBe('203.0.113.9');
    expect(forwardedFor(undefined, undefined)).toBe('');
  });
});
