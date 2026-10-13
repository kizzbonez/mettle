/**
 * Browser-side client for the Mettle API. Every call goes to /api on this
 * origin, carries the header the API requires on state-changing requests, and
 * transparently renews an expired access token once.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Field name to message, for forms. */
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const BASE = '/api/v1';
const OFFLINE = 'Could not reach the server. Check your connection and try again.';

/**
 * Endpoints where a 401 means "those credentials are wrong", not "your access
 * token has expired". Everything else, including /auth/me, is retried once
 * after renewing the token.
 */
const NEVER_RENEW = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/setup/'];

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time, shared by every request that hit a 401 together. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'x-mettle-request': '1' } })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function toError(status: number, payload: unknown): ApiError {
  const error = (payload as { error?: { code?: string; message?: string; details?: { fields?: Record<string, string> } } } | null)?.error;
  return new ApiError(status, error?.code ?? 'unknown', error?.message ?? 'Something went wrong.', error?.details?.fields);
}

async function send(method: Method, path: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, {
      method,
      headers: { 'x-mettle-request': '1', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'offline', OFFLINE);
  }
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response = await send(method, path, body);
  const renewable = response.status === 401 && !NEVER_RENEW.some((prefix) => path.startsWith(prefix));
  if (renewable && (await refreshSession())) response = await send(method, path, body);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toError(response.status, payload);
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown = {}) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** The message to show a person, whatever was thrown. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

export function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fields : {};
}
