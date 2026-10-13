/** An error with an HTTP status and a stable machine-readable code. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code = 'bad_request', details?: unknown) =>
  new HttpError(400, code, message, details);

export const unauthorized = (message = 'Sign in to continue.', code = 'unauthorized') =>
  new HttpError(401, code, message);

export const forbidden = (message = 'You do not have access to this.', code = 'forbidden') =>
  new HttpError(403, code, message);

export const notFound = (what = 'Page') => new HttpError(404, 'not_found', `${what} not found.`);

export const conflict = (message: string, code = 'conflict') => new HttpError(409, code, message);

export const tooManyRequests = (message: string, code = 'rate_limited') => new HttpError(429, code, message);
