import http from 'node:http';
import type { Duplex } from 'node:stream';
import { config } from '../config';

/**
 * A deliberately small Docker Engine client: JSON calls plus the one hijacked
 * stream that `exec` needs. The runner holds the Docker socket, so it carries
 * as little third-party code as possible.
 */

export interface DockerResponse<T> {
  status: number;
  body: T;
}

const REQUEST_TIMEOUT_MS = 20_000;

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function dockerRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<DockerResponse<T>> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const headers: http.OutgoingHttpHeaders = payload
      ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      : {};
    const req = http.request({ socketPath: config.dockerSocket, method, path, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode ?? 0, body: parseBody(text) as T });
      });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error(`Docker API timeout: ${path}`)));
    req.on('error', reject);
    req.end(payload);
  });
}

export async function dockerOk<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await dockerRequest<T & { message?: string }>(method, path, body);
  if (res.status >= 200 && res.status < 300) return res.body;
  const detail = res.body?.message ?? 'no detail';
  throw new Error(`Docker ${method} ${path.split('?')[0]} failed (${res.status}): ${detail}`);
}

/** POST that upgrades to a raw duplex stream (used by `exec start`). */
export function dockerHijack(path: string, body: unknown): Promise<Duplex> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      socketPath: config.dockerSocket,
      method: 'POST',
      path,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Connection: 'Upgrade',
        Upgrade: 'tcp',
      },
    });
    req.on('upgrade', (_res, socket, head) => {
      if (head.length > 0) socket.unshift(head);
      resolve(socket);
    });
    req.on('response', (res) => {
      res.resume();
      reject(new Error(`Docker did not upgrade ${path} (${res.statusCode})`));
    });
    req.on('error', reject);
    req.end(payload);
  });
}
