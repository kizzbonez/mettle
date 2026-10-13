import path from 'node:path';
import type { NextConfig } from 'next';

const apiOrigin = process.env.API_ORIGIN ?? 'http://127.0.0.1:4311';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  transpilePackages: ['@mettle/shared'],
  poweredByHeader: false,
  // The dev server would otherwise write an AGENTS.md into this folder.
  agentRules: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  devIndicators: false,
  // The browser only ever talks to this origin; the API stays private.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default config;
