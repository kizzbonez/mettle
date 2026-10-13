import type { FastifyError, FastifyInstance } from 'fastify';
import { HttpError } from '../lib/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_HEADER = 'x-mettle-request';

/**
 * A cross-site form cannot set a custom header, and a cross-origin fetch that
 * tries triggers a CORS preflight, which this API never approves. Requiring
 * the header on every state-changing request is therefore a CSRF defense.
 */
function registerCsrfCheck(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    if (SAFE_METHODS.has(request.method)) return;
    if (!request.headers[CSRF_HEADER]) {
      throw new HttpError(403, 'csrf', 'This request was not sent by the Mettle app.');
    }
  });
}

/** Nothing the API returns may be stored by a shared cache or a CDN. */
function registerNoStore(app: FastifyInstance): void {
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });
}

function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | HttpError, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.status).send({ error: { code: error.code, message: error.message, details: error.details } });
    }
    const status = error.statusCode ?? 500;
    if (status === 429) {
      return reply.code(429).send({ error: { code: 'rate_limited', message: 'Too many requests. Slow down and try again.' } });
    }
    if (status >= 400 && status < 500) {
      return reply.code(status).send({ error: { code: 'bad_request', message: 'The request could not be understood.' } });
    }
    request.log.error(error);
    return reply.code(500).send({ error: { code: 'internal', message: 'Something went wrong on our side.' } });
  });
  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: { code: 'not_found', message: 'Not found.' } });
  });
}

export function registerHttpBasics(app: FastifyInstance): void {
  app.decorateRequest('currentUser', null);
  registerCsrfCheck(app);
  registerNoStore(app);
  registerErrorHandler(app);
}
