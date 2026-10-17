---
title: Node Services in TypeScript
summary: Write an HTTP service with node:http and a typed route table, read and validate JSON bodies with size limits and structured errors, load configuration from the environment once and fail fast, and shut down gracefully on SIGTERM without dropping requests.
minutes: 40
objectives:
  - Start an HTTP server on 127.0.0.1, call it with fetch, and close it
  - Route requests through a typed table and answer every failure with a structured JSON error
  - Read a request body with a size limit, treat parsed JSON as unknown, and validate it
  - Load typed configuration from environment variables and shut down gracefully on signals
---

## Outline

1. A server in a few lines
2. Configuration from the environment
3. Typed routes and structured errors
4. Reading and validating bodies
5. Graceful shutdown

## A server in a few lines

`node:http` is Node's built-in HTTP module. `createServer` takes a **request listener**, a function called for every request with two objects: the request (`IncomingMessage`: method, URL, headers, and the body as a stream) and the response (`ServerResponse`, which you write the status, headers and body to). `listen` binds an address and port; port 0 asks the operating system for any free port, which is what tests use. The global `fetch` calls it from the same process:

```ts
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ method: request.method, url: request.url }));
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const { port } = server.address() as AddressInfo;

const reply = await fetch(`http://127.0.0.1:${port}/stations?limit=2`);
console.log(reply.status, reply.headers.get("content-type"));
console.log(await reply.json());
server.close();
```

```text
200 application/json
{ method: 'GET', url: '/stations?limit=2' }
```

`once(server, "listening")` turns the event into a promise. `server.address()` can also return a string (for a pipe), so the code states it is an `AddressInfo`. Binding to `127.0.0.1` accepts connections from this machine only; a container that must be reachable from outside binds `0.0.0.0` instead. Without `server.close()` the process would never end, because a listening server keeps it alive.

## Configuration from the environment

A deployed service gets its settings from **environment variables**: the same build runs in testing and production with different values, and secrets stay out of the code. Read them **once, at startup**, into a typed, read-only object, and refuse to start if anything is wrong, listing every problem at once:

```ts
export interface Config {
  readonly host: string;
  readonly port: number;
  readonly maxBodyBytes: number;
}

function integer(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number, problems: string[]): number {
  const raw = env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isInteger(value) || value < min || value > max) {
    problems.push(`${name} must be an integer from ${min} to ${max}, got "${raw}"`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const problems: string[] = [];
  const config = {
    host: env["HOST"] ?? "127.0.0.1",
    port: integer(env, "PORT", 8080, 0, 65535, problems),
    maxBodyBytes: integer(env, "MAX_BODY_BYTES", 16_384, 1, 1_048_576, problems),
  };
  if (problems.length > 0) {
    throw new Error(`invalid configuration:\n  ${problems.join("\n  ")}`);
  }
  return config;
}
```

`loadConfig({ PORT: "3000" })` and `loadConfig({ PORT: "eighty", MAX_BODY_BYTES: "0" })` give:

```text
{ host: '127.0.0.1', port: 3000, maxBodyBytes: 16384 }
invalid configuration:
  PORT must be an integer from 0 to 65535, got "eighty"
  MAX_BODY_BYTES must be an integer from 1 to 1048576, got "0"
```

Every value in `process.env` is `string | undefined`, so each needs parsing and a default. Taking `env` as a parameter instead of reading `process.env` inside makes the function easy to test. For local development, `node --env-file=.env dist/server.js` loads a file of `NAME=value` lines; variables already set in the environment win, and the `.env` file never goes into git.

## Typed routes and structured errors

A **route table** maps `"METHOD /path"` to a handler. Giving every handler the same type means the compiler checks that each one returns a status and a body, and that the body it receives is `unknown` until validated:

```ts
interface Reply {
  status: number;
  body: unknown;
}

type Handler = (body: unknown) => Reply;

function errorReply(status: number, code: string, message: string, details?: string[]): Reply {
  return { status, body: { error: { code, message, ...(details && { details }) } } };
}

const routes = new Map<string, Handler>([
  ["GET /readings", () => ({ status: 200, body: { readings } })],
  ["POST /readings", (body) => {
    const result = checkReading(body);
    if (Array.isArray(result)) return errorReply(400, "invalid_body", "the reading is not valid", result);
    readings.push(result);
    return { status: 201, body: result };
  }],
]);
```

`checkReading(body: unknown): Reading | string[]` narrows the body the way the medium level's validators did, collecting every problem instead of stopping at the first. Every failure has the same **structured** shape, `{ "error": { "code", "message", "details"? } }`: clients branch on the stable `code` and show the `message`. A dispatcher looks up the handler and turns exceptions into replies:

```ts
async function route(request: IncomingMessage, maxBodyBytes: number): Promise<Reply> {
  try {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    const handler = routes.get(`${request.method} ${pathname}`);
    if (!handler) return errorReply(404, "not_found", `no route for ${request.method} ${pathname}`);
    return handler(await readJson(request, maxBodyBytes));
  } catch (error) {
    if (error instanceof HttpError) return errorReply(error.status, error.code, error.message);
    console.error(error);
    return errorReply(500, "internal", "internal error");
  }
}
```

`HttpError` is a small `Error` subclass with `status` and `code` fields. An unexpected error is logged on the server and answered with a generic 500: its message could reveal internals, so it never goes to the client.

## Reading and validating bodies

The body arrives as a stream of chunks. Read it with a limit, so one client cannot make the service buffer a gigabyte, and treat the parsed JSON as `unknown`:

```ts
async function readJson(request: IncomingMessage, limit: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size <= limit) chunks.push(chunk);
  }
  if (size > limit) throw new HttpError(413, "payload_too_large", `the body exceeds ${limit} bytes`);
  const text = Buffer.concat(chunks).toString("utf8");
  if (text === "") return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "the body is not valid JSON");
  }
}
```

The server's listener awaits `route` and writes the reply as JSON. Calling it with `fetch` (limit 1024 bytes) shows each path:

```text
POST /readings 201 {"station":"OSL","celsius":-3.5}
POST /readings 400 {"error":{"code":"invalid_body","message":"the reading is not valid","details":["station must be three capital letters","celsius must be a number from -90 to 60"]}}
POST /readings 400 {"error":{"code":"invalid_json","message":"the body is not valid JSON"}}
POST /readings 413 {"error":{"code":"payload_too_large","message":"the body exceeds 1024 bytes"}}
GET /readings 200 {"readings":[{"station":"OSL","celsius":-3.5}]}
DELETE /readings 404 {"error":{"code":"not_found","message":"no route for DELETE /readings"}}
```

## Graceful shutdown

Orchestrators such as Kubernetes and Docker stop a process by sending **SIGTERM**, then kill it if it is still running after a grace period. Exiting at once drops the requests in flight. A **graceful shutdown** stops accepting connections, finishes what is running, then exits:

```ts
function shutdownOn(server: Server, signals: readonly NodeJS.Signals[]): void {
  for (const signal of signals) {
    process.once(signal, () => {
      console.log(`${signal} received, closing`);
      const deadline = setTimeout(() => server.closeAllConnections(), 10_000).unref();
      server.close((error) => {
        clearTimeout(deadline);
        console.log("closed");
        process.exitCode = error ? 1 : 0;
      });
    });
  }
}
```

```text
SIGTERM received, closing
closed
```

Installing a listener replaces Node's default of exiting on the signal, so the handler decides. `server.close()` stops accepting connections, closes idle ones, and calls back when the last connection has closed. Setting `process.exitCode` lets the process end on its own once nothing is left. The `unref()`ed timer is a backstop that cuts connections still open after ten seconds, and does not itself keep the process alive.

One trap remains: **keep-alive**. `fetch` and browsers keep a connection open after a response to reuse it, and `close()` only closes the connections idle *at the moment it is called*. A request that finishes afterwards leaves its connection open until the client drops it; in testing, a `fetch` connection held `close()` open for three seconds. The fix is to send `connection: close` on responses written while shutting down, which this service does, because `server.listening` turns `false` as soon as `close()` is called:

```ts
response.writeHead(reply.status, {
  "content-type": "application/json; charset=utf-8",
  ...(!server.listening && { connection: "close" }),
});
```

## Common mistakes

- **Reading `process.env` all over the code.** A typo in a name becomes `undefined` far from startup. Parse it once into a `Config`.
- **Trusting `JSON.parse`.** It returns `any`; a handler that uses it directly crashes or stores garbage. Validate the `unknown` value.
- **Sending `error.message` or a stack trace to clients.** Log it; send a generic 500.
- **`process.exit()` in the signal handler**, which cuts off in-flight requests. Close the server and set `process.exitCode`.

## Practice

1. Add `GET /health` that returns `{ "status": "ok" }`.
2. Make `POST /readings` refuse more than 1000 stored readings with 409 and the code `"full"`.
3. Why does a test start the server on port 0 rather than 8080?

### Answers

1. Add `["GET /health", () => ({ status: 200, body: { status: "ok" } })]` to the table.
2. Before `readings.push(result)`, add `if (readings.length >= 1000) return errorReply(409, "full", "the station log is full");`.
3. Port 0 lets the operating system pick a free port, so tests never collide with each other or with a service already using 8080; `server.address()` reports the port chosen.

## Key takeaways

- `createServer`, `listen(0, "127.0.0.1")` and `fetch` make a service you can test in one process; always `close()` it.
- Parse environment variables once into a typed, read-only `Config` and fail fast with every problem listed.
- A typed route table and one structured error shape keep handlers consistent; unexpected errors become a generic 500.
- Limit body size, and treat parsed JSON as `unknown` until validated.
- On SIGTERM, `close()` the server, guard keep-alive with `connection: close`, set `process.exitCode`, and keep an `unref()`ed deadline.

## Further reading

- [Node.js 26: HTTP](https://nodejs.org/docs/latest-v26.x/api/http.html)
- [Node.js 26: Process signal events](https://nodejs.org/docs/latest-v26.x/api/process.html#signal-events)
- [Node.js 26: Command-line options, --env-file](https://nodejs.org/docs/latest-v26.x/api/cli.html#--env-filefile)
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
