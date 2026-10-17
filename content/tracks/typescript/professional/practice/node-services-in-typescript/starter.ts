// Laundry Status Board
//
// A typed route table with path parameters, structured JSON errors, and a node:http server
// on 127.0.0.1 that serves it.
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export type Method = "GET" | "POST" | "DELETE";

// Step 1: replace string with a template literal type: a Method, one space, then a path
// that starts with "/", such as "GET /machines/:id".
export type RouteKey = string;

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

// Step 2: the parameters of a path that matches the pattern, or null.
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  throw new Error("Not implemented");
}

// Step 3: answer a method and a URL from the route table.
export function createHandler(routes: Routes): Handle {
  throw new Error("Not implemented");
}

// Step 4: serve a handle over HTTP on 127.0.0.1, on a free port.
export async function startServer(handle: Handle): Promise<RunningServer> {
  throw new Error("Not implemented");
}
