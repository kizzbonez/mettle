import type { FastifyInstance } from 'fastify';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface TestResponse<T = any> {
  status: number;
  body: T;
  setCookies: string[];
}

/** A browser stand-in: keeps cookies between requests and sends the CSRF header. */
export class TestClient {
  readonly cookies = new Map<string, string>();

  constructor(
    private readonly app: FastifyInstance,
    private readonly csrf = true,
  ) {}

  private async send<T>(method: Method, url: string, payload?: unknown): Promise<TestResponse<T>> {
    const cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    const response = await this.app.inject({
      method,
      url: `/v1${url}`,
      payload: payload as object | undefined,
      headers: { ...(this.csrf ? { 'x-mettle-request': '1' } : {}), ...(cookie ? { cookie } : {}) },
    });
    for (const item of response.cookies) {
      if (item.value === '') this.cookies.delete(item.name);
      else this.cookies.set(item.name, item.value);
    }
    const header = response.headers['set-cookie'];
    const setCookies = header === undefined ? [] : Array.isArray(header) ? header : [String(header)];
    return { status: response.statusCode, body: response.json() as T, setCookies };
  }

  get = <T = any>(url: string) => this.send<T>('GET', url);
  post = <T = any>(url: string, body: unknown = {}) => this.send<T>('POST', url, body);
  put = <T = any>(url: string, body: unknown = {}) => this.send<T>('PUT', url, body);
  patch = <T = any>(url: string, body: unknown = {}) => this.send<T>('PATCH', url, body);
  delete = <T = any>(url: string) => this.send<T>('DELETE', url);
}

let counter = 0;

/** A unique address per call, so tests never collide on the unique email index. */
export function uniqueEmail(prefix = 'learner'): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.test`;
}

export const PASSWORD = 'correct-horse-9-battery';

/** Registers a new learner and returns a signed-in client for them. */
export async function registerLearner(app: FastifyInstance, email = uniqueEmail()) {
  const client = new TestClient(app);
  const response = await client.post('/auth/register', {
    displayName: 'Test Learner',
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
  if (response.status !== 201) throw new Error(`register failed: ${JSON.stringify(response.body)}`);
  return { client, email, userId: response.body.user.id as string };
}
