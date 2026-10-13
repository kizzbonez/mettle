import { timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import type { RunnerResponse } from '@mettle/shared';
import { config } from './config';
import { dockerRequest } from './docker/http';
import { execute } from './execute';
import { BusyError, Gate } from './gate';
import { startReaper } from './reaper';
import { executeSchema } from './request-schema';

const app = Fastify({ logger: true, bodyLimit: 4 * 1024 * 1024 });
const gate = new Gate(config.maxConcurrency, config.maxQueue);

function authorized(request: FastifyRequest): boolean {
  const presented = Buffer.from(request.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${config.token}`);
  return presented.length === expected.length && timingSafeEqual(presented, expected);
}

async function imageStatus(): Promise<Record<string, boolean>> {
  const entries = await Promise.all(
    Object.entries(config.images).map(async ([language, image]) => {
      const res = await dockerRequest('GET', `/images/${encodeURIComponent(image)}/json`);
      return [language, res.status === 200] as const;
    }),
  );
  return Object.fromEntries(entries);
}

app.get('/health', async (_request, reply) => {
  try {
    const images = await imageStatus();
    const ok = Object.values(images).every(Boolean);
    return reply.code(ok ? 200 : 503).send({ ok, images, ...gate.stats });
  } catch (error) {
    return reply.code(503).send({ ok: false, error: (error as Error).message });
  }
});

app.post('/execute', async (request: FastifyRequest, reply: FastifyReply) => {
  if (!authorized(request)) return reply.code(401).send({ error: 'unauthorized' });
  const parsed = executeSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message });
  try {
    return await gate.run(() => execute(parsed.data));
  } catch (error) {
    if (error instanceof BusyError) return reply.code(503).send({ error: error.message });
    request.log.error(error, 'sandbox failure');
    const failure: RunnerResponse = {
      status: 'error',
      compile: null,
      tests: [],
      durationMs: 0,
      error: 'The sandbox could not run this submission.',
    };
    return reply.code(200).send(failure);
  }
});

async function main(): Promise<void> {
  startReaper((error) => app.log.warn(error, 'reaper failed'));
  await app.listen({ port: config.port, host: config.host });
}

main().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
