import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { env, isProduction } from './config/env';
import { accountRoutes } from './features/account/routes';
import { adminRoutes } from './features/admin/routes';
import { authRoutes } from './features/auth/routes';
import { catalogRoutes, publicRoutes } from './features/catalog/routes';
import { examRoutes } from './features/exams/routes';
import { labRoutes } from './features/labs/routes';
import { lessonRoutes } from './features/lessons/routes';
import { progressRoutes } from './features/progress/routes';
import { setupRoutes } from './features/setup/routes';
import { registerHttpBasics } from './plugins/http';

async function v1(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ ok: true }));
  await app.register(publicRoutes);
  await app.register(setupRoutes);
  await app.register(authRoutes);
  await app.register(accountRoutes);
  await app.register(catalogRoutes);
  await app.register(lessonRoutes);
  await app.register(examRoutes);
  await app.register(labRoutes);
  await app.register(progressRoutes);
  await app.register(adminRoutes);
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: isProduction ? 'info' : 'debug' },
    // Only private-network peers may set the client address; see config/env.ts.
    trustProxy: env.TRUSTED_PROXIES,
    bodyLimit: 1024 * 1024,
  });
  await app.register(cookie);
  // The API serves JSON only; a document CSP belongs to the web app.
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { global: true, max: 600, timeWindow: '1 minute', allowList: () => !env.RATE_LIMITS });
  registerHttpBasics(app);
  await app.register(v1, { prefix: '/v1' });
  return app;
}
