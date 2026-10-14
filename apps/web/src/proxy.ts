import { NextResponse, type NextRequest } from 'next/server';
import { frameAncestors, frameAncestorsDirective } from '@/lib/framing';

/** Pages that need a session. Everything else is public. */
const PROTECTED = ['/dashboard', '/courses', '/lessons', '/exams', '/attempts', '/labs', '/profile', '/admin'];
/** Pages a signed-in user has no reason to see. */
const GUEST_ONLY = ['/login', '/register', '/forgot-password'];
/** Set at sign-in next to the real session cookies; it carries no secret. */
const SESSION_MARKER = 'mt_s';

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

function contentSecurityPolicy(nonce: string, secureOrigin: boolean, framers: string[]): string {
  const dev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    // Scripts run only with this request's nonce, or when loaded by one that has it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    // The code editor injects style elements at runtime.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? ' ws:' : ''}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    frameAncestorsDirective(framers),
    ...(secureOrigin ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

/**
 * Two jobs: a fresh Content-Security-Policy nonce for every page, and a cheap
 * first check on protected pages. The check only looks for a marker cookie so
 * that visitors are sent to sign in without a round trip; the API decides what
 * a request may actually read.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_MARKER);

  if (!signedIn && startsWithAny(pathname, PROTECTED)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  if (signedIn && startsWithAny(pathname, GUEST_ONLY)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const framers = frameAncestors(process.env.FRAME_ANCESTORS);
  const csp = contentSecurityPolicy(nonce, request.nextUrl.protocol === 'https:', framers);
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  // X-Frame-Options cannot name another site, so it is sent only when no site may frame the page.
  // Where some may, the CSP frame-ancestors list above is what browsers follow.
  if (framers.length === 0) response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

export const config = {
  matcher: [
    // Pages only: not the API proxy, build assets, the editor files or images.
    {
      source: '/((?!api/|_next/static|_next/image|monaco/|guide-shots/|brand/|favicon.ico|icon.svg).*)',
      // Link prefetches do not render a document, so they need no nonce.
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
