const FALLBACK = '/dashboard';

/**
 * Where to go after signing in. The `next` parameter comes from the URL, so
 * it is only honored when it is a plain path on this site: an absolute URL or
 * a `//host` path would turn the sign-in page into an open redirect.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return FALLBACK;
  if (/^\/(login|register|forgot-password|reset-password|setup)(\/|\?|$)/.test(next)) return FALLBACK;
  return next;
}
