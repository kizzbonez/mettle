import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, errorMessage, fieldErrors } from './api';

type Reply = { status: number; body?: unknown };

/** Replaces fetch with a script: each call takes the next reply for its path. */
function script(replies: Record<string, Reply[]>) {
  const calls: { path: string; method: string; headers: Record<string, string>; body?: string }[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const path = url.replace('/api/v1', '');
    calls.push({ path, method: init.method ?? 'GET', headers: init.headers as Record<string, string>, body: init.body as string | undefined });
    const reply = replies[path]?.shift();
    if (!reply) throw new Error(`unexpected request to ${path}`);
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), { status: reply.status });
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends the header the API requires and a JSON body', async () => {
    const calls = script({ '/account': [{ status: 200, body: { ok: true } }] });
    await api.patch('/account', { displayName: 'Ada' });
    expect(calls[0]).toMatchObject({ method: 'PATCH', body: '{"displayName":"Ada"}' });
    expect(calls[0]?.headers).toMatchObject({ 'x-mettle-request': '1', 'content-type': 'application/json' });
  });

  it('renews an expired access token once and repeats the request', async () => {
    const calls = script({
      '/me/dashboard': [{ status: 401, body: { error: { code: 'unauthorized' } } }, { status: 200, body: { stats: {} } }],
      '/auth/refresh': [{ status: 200, body: { ok: true } }],
    });
    await expect(api.get('/me/dashboard')).resolves.toEqual({ stats: {} });
    expect(calls.map((call) => call.path)).toEqual(['/me/dashboard', '/auth/refresh', '/me/dashboard']);
  });

  it('renews for the account check too, so a page load does not sign anyone out', async () => {
    const calls = script({
      '/auth/me': [{ status: 401, body: {} }, { status: 200, body: { user: { id: 'u1' } } }],
      '/auth/refresh': [{ status: 200, body: { ok: true } }],
    });
    await expect(api.get('/auth/me')).resolves.toEqual({ user: { id: 'u1' } });
    expect(calls).toHaveLength(3);
  });

  it('shares one renewal between requests that fail together', async () => {
    const calls = script({
      '/catalog': [{ status: 401, body: {} }, { status: 200, body: { tracks: [] } }],
      '/me/courses': [{ status: 401, body: {} }, { status: 200, body: { courses: [] } }],
      '/auth/refresh': [{ status: 200, body: { ok: true } }],
    });
    await Promise.all([api.get('/catalog'), api.get('/me/courses')]);
    expect(calls.filter((call) => call.path === '/auth/refresh')).toHaveLength(1);
  });

  it('does not try to renew when the credentials themselves were wrong', async () => {
    const calls = script({ '/auth/login': [{ status: 401, body: { error: { code: 'invalid_credentials', message: 'No match.' } } }] });
    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ status: 401, code: 'invalid_credentials', message: 'No match.' });
    expect(calls).toHaveLength(1);
  });

  it('gives up when the session cannot be renewed', async () => {
    script({ '/catalog': [{ status: 401, body: { error: { code: 'unauthorized', message: 'Sign in to continue.' } } }], '/auth/refresh': [{ status: 401, body: {} }] });
    await expect(api.get('/catalog')).rejects.toMatchObject({ status: 401 });
  });

  it('turns a validation error into field messages', async () => {
    script({ '/auth/register': [{ status: 400, body: { error: { code: 'validation_failed', message: 'Check the fields.', details: { fields: { email: 'Enter a valid email address.' } } } } }] });
    const error = await api.post('/auth/register', {}).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(fieldErrors(error)).toEqual({ email: 'Enter a valid email address.' });
    expect(errorMessage(error)).toBe('Check the fields.');
  });

  it('reports a network failure in plain words', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed');
    });
    await expect(api.get('/catalog')).rejects.toMatchObject({ status: 0, code: 'offline' });
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
