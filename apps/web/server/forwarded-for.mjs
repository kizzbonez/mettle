// Pure address logic for the X-Forwarded-For preload. Kept free of side
// effects so it can be unit-tested (src/server/forwarded-for.test.ts).

/** "::ffff:172.18.0.1" (an IPv4 address seen through an IPv6 socket) becomes "172.18.0.1". */
export function normalizeAddress(address) {
  const value = (address ?? '').trim().toLowerCase();
  return value.startsWith('::ffff:') && value.includes('.') ? value.slice(7) : value;
}

function isPrivateV4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

function isPrivateV6(address) {
  if (address === '::1') return true;
  const first = Number.parseInt(address.split(':')[0] || '0', 16);
  // fc00::/7 is unique-local, fe80::/10 is link-local.
  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80;
}

/**
 * True for loopback, link-local and private-network addresses: where a
 * reverse proxy, a tunnel or a container gateway lives. A peer from anywhere
 * else is a client, and a client does not get to say who it is.
 */
export function isPrivateAddress(address) {
  const value = normalizeAddress(address);
  if (!value) return false;
  return value.includes(':') ? isPrivateV6(value) : isPrivateV4(value);
}

/**
 * The X-Forwarded-For value to pass on to the API.
 *
 * - The peer is a proxy we trust: keep the chain it reported and add the
 *   proxy itself, as any well-behaved proxy would.
 * - The peer is anyone else: whatever chain it sent is its own claim, so it
 *   is thrown away and replaced by the address the connection came from.
 */
export function forwardedFor(prior, peerAddress) {
  const peer = normalizeAddress(peerAddress);
  const chain = Array.isArray(prior) ? prior.join(', ') : (prior ?? '').trim();
  if (!peer) return chain;
  return chain && isPrivateAddress(peer) ? `${chain}, ${peer}` : peer;
}
