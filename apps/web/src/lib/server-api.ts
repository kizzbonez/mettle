import 'server-only';

const apiOrigin = process.env.API_ORIGIN ?? 'http://127.0.0.1:4311';

/**
 * Reads public data from the API during server rendering. Returns null when
 * the API cannot be reached, so a public page can still render.
 */
export async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiOrigin}/v1${path}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}
