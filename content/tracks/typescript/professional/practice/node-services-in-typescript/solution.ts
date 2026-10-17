// Laundry Status Board
//
// A typed route table with path parameters, structured JSON errors, and a node:http server
// on 127.0.0.1 that serves it.
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export type Method = "GET" | "POST" | "DELETE";

export type RouteKey = `${Method} /${string}`;

export type ErrorCode = "bad_request" | "not_found" | "method_not_allowed" | "internal";

export interface Reply {
  readonly status: number;
  readonly body: unknown;
}

export interface RouteInput {
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
}

export type RouteHandler = (input: RouteInput) => Reply;
export type Routes = Readonly<Record<RouteKey, RouteHandler>>;
export type Handle = (method: string, url: string) => Reply;

export interface RunningServer {
  readonly url: string;
  close(): Promise<void>;
}

// This one is complete: the one shape of every error.
export function errorReply(status: number, code: ErrorCode, message: string): Reply {
  return { status, body: { error: { code, message } } };
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const wanted = pattern.split("/");
  const given = path.split("/");
  if (wanted.length !== given.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < wanted.length; i++) {
    const segment = wanted[i];
    if (segment.startsWith(":")) {
      if (given[i] === "") return null;
      params[segment.slice(1)] = given[i];
    } else if (segment !== given[i]) {
      return null;
    }
  }
  return params;
}

export function createHandler(routes: Routes): Handle {
  const table = Object.entries(routes).map(([key, handler]) => {
    const space = key.indexOf(" ");
    return { method: key.slice(0, space), pattern: key.slice(space + 1), handler };
  });

  return (method, url) => {
    const { pathname, searchParams } = new URL(url, "http://localhost");
    let pathKnown = false;
    for (const route of table) {
      const params = matchPath(route.pattern, pathname);
      if (params === null) continue;
      pathKnown = true;
      if (route.method !== method) continue;
      try {
        return route.handler({ params, query: searchParams });
      } catch (error) {
        console.error(error); // logged on the server, never sent to the client
        return errorReply(500, "internal", "internal error");
      }
    }
    return pathKnown
      ? errorReply(405, "method_not_allowed", `${method} is not allowed on ${pathname}`)
      : errorReply(404, "not_found", `no route for ${pathname}`);
  };
}

export async function startServer(handle: Handle): Promise<RunningServer> {
  const server = createServer((request, response) => {
    let reply: Reply;
    try {
      reply = handle(request.method ?? "GET", request.url ?? "/");
    } catch (error) {
      console.error(error);
      reply = errorReply(500, "internal", "internal error");
    }
    response.writeHead(reply.status, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(reply.body));
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
