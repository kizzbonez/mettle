import type { FastifyReply } from 'fastify';
import { cookiesAreSecure } from '../../config/env';
import { ACCESS_TTL_SECONDS } from '../../lib/jwt';

export const ACCESS_COOKIE = 'mt_at';
export const REFRESH_COOKIE = 'mt_rt';
/** Carries no secret. Lets the web app's proxy tell a visitor from a signed-in user. */
export const MARKER_COOKIE = 'mt_s';

export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
/** The refresh token is only ever sent to the auth endpoints (as the browser sees them). */
const REFRESH_PATH = '/api/v1/auth';

const base = { httpOnly: true, secure: cookiesAreSecure } as const;

export function setAccessCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(ACCESS_COOKIE, token, { ...base, sameSite: 'lax', path: '/', maxAge: ACCESS_TTL_SECONDS });
}

export function setSessionCookies(reply: FastifyReply, access: string, refresh: string): void {
  setAccessCookie(reply, access);
  reply.setCookie(REFRESH_COOKIE, refresh, {
    ...base,
    sameSite: 'strict',
    path: REFRESH_PATH,
    maxAge: REFRESH_TTL_SECONDS,
  });
  reply.setCookie(MARKER_COOKIE, '1', { ...base, sameSite: 'lax', path: '/', maxAge: REFRESH_TTL_SECONDS });
}

export function clearSessionCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_COOKIE, { path: '/' });
  reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  reply.clearCookie(MARKER_COOKIE, { path: '/' });
}
