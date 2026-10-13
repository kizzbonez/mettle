import type { Role } from '@mettle/shared';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ISSUER = 'mettle';
export const ACCESS_TTL_SECONDS = 15 * 60;

export interface AccessClaims {
  userId: string;
  sessionId: string;
  role: Role;
}

export function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ sid: claims.sessionId, role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret);
}

/** Returns the claims, or null for a token that is missing, forged or expired. */
export async function verifyAccessToken(token: string | undefined): Promise<AccessClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
    return { userId: payload.sub, sessionId: payload.sid, role: payload.role as Role };
  } catch {
    return null;
  }
}
