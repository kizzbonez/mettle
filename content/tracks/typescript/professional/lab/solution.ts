import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

// ---------- Types ----------

export type Cone = "06" | "04" | "6" | "10";

export type ErrorCode =
  | "invalid_body"
  | "invalid_json"
  | "payload_too_large"
  | "not_found"
  | "method_not_allowed"
  | "kiln_full"
  | "internal";

export interface Config {
  readonly host: string;
  readonly port: number;
  readonly maxLoadKg: number;
}

export interface BookingRequest {
  readonly member: string;
  readonly pieces: number;
  readonly weightKg: number;
  readonly cone: Cone;
}

export interface Booking extends BookingRequest {
  readonly id: string;
}

export interface FieldProblem {
  readonly field: string;
  readonly problem: string;
}

export type ValidationResult =
  | { readonly ok: true; readonly booking: BookingRequest }
  | { readonly ok: false; readonly problems: readonly FieldProblem[] };

export interface ApiRequest {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
}

export interface ApiResponse {
  readonly status: number;
  readonly body: unknown;
}

export type Handler = (request: ApiRequest) => ApiResponse | Promise<ApiResponse>;

export interface RunningServer {
  readonly url: string;
  close(): Promise<void>;
}

export const MAX_BODY_BYTES = 16_384;

export class ConfigError extends Error {
  readonly problems: readonly string[];
  constructor(problems: readonly string[]) {
    super(`invalid configuration: ${problems.join("; ")}`);
    this.name = "ConfigError";
    this.problems = problems;
  }
}

// ---------- Configuration ----------

export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const problems: string[] = [];

  let host = "127.0.0.1";
  const rawHost = env["KILN_HOST"];
  if (rawHost !== undefined) {
    host = rawHost.trim();
    if (host === "") problems.push("KILN_HOST must not be empty");
  }

  let port = 8080;
  const rawPort = env["KILN_PORT"];
  if (rawPort !== undefined) {
    const text = rawPort.trim();
    port = Number(text);
    if (!/^\d+$/.test(text) || port > 65535) {
      problems.push(`KILN_PORT must be a whole number from 0 to 65535, got "${rawPort}"`);
    }
  }

  let maxLoadKg = 60;
  const rawLoad = env["KILN_MAX_LOAD_KG"];
  if (rawLoad !== undefined) {
    const text = rawLoad.trim();
    maxLoadKg = Number(text);
    if (!/^\d+(\.\d+)?$/.test(text) || maxLoadKg <= 0 || maxLoadKg > 500) {
      problems.push(`KILN_MAX_LOAD_KG must be a number above 0 and at most 500, got "${rawLoad}"`);
    }
  }

  if (problems.length > 0) throw new ConfigError(problems);
  return Object.freeze({ host, port, maxLoadKg });
}

// ---------- Validation ----------

const CONES: readonly Cone[] = ["06", "04", "6", "10"];
const KNOWN_FIELDS = new Set(["member", "pieces", "weightKg", "cone"]);

function isCone(value: unknown): value is Cone {
  return CONES.some((cone) => cone === value);
}

export function validateBooking(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, problems: [{ field: "body", problem: "must be a JSON object" }] };
  }
  const fields = body as Record<string, unknown>;
  const { member, pieces, weightKg, cone } = fields;
  const problems: FieldProblem[] = [];

  const name = typeof member === "string" ? member.trim() : "";
  if (name.length < 1 || name.length > 40) {
    problems.push({ field: "member", problem: "must be a name of 1 to 40 characters" });
  }
  if (typeof pieces !== "number" || !Number.isInteger(pieces) || pieces < 1 || pieces > 20) {
    problems.push({ field: "pieces", problem: "must be a whole number from 1 to 20" });
  }
  if (typeof weightKg !== "number" || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 25) {
    problems.push({ field: "weightKg", problem: "must be a number above 0 and at most 25" });
  }
  if (!isCone(cone)) {
    problems.push({ field: "cone", problem: `must be one of ${CONES.join(", ")}` });
  }
  for (const key of Object.keys(fields)) {
    if (!KNOWN_FIELDS.has(key)) problems.push({ field: key, problem: "is not a known field" });
  }

  if (problems.length > 0 || typeof pieces !== "number" || typeof weightKg !== "number" || !isCone(cone)) {
    return { ok: false, problems };
  }
  return { ok: true, booking: { member: name, pieces, weightKg, cone } };
}

// ---------- Handler ----------

export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: readonly FieldProblem[],
): ApiResponse {
  const error = details === undefined ? { code, message } : { code, message, details };
  return { status, body: { error } };
}

export function createHandler(config: Config): (request: ApiRequest) => ApiResponse {
  const bookings: Booking[] = [];
  let loadKg = 0;

  function book(body: unknown): ApiResponse {
    const result = validateBooking(body);
    if (!result.ok) {
      return errorResponse(400, "invalid_body", "the booking is not valid", result.problems);
    }
    if (loadKg + result.booking.weightKg > config.maxLoadKg) {
      return errorResponse(409, "kiln_full", `only ${config.maxLoadKg - loadKg} kg of shelf space is left`);
    }
    const booking: Booking = { id: `B-${bookings.length + 1}`, ...result.booking };
    bookings.push(booking);
    loadKg += booking.weightKg;
    return { status: 201, body: { booking } };
  }

  return (request) => {
    const { method, path, body } = request;
    if (path === "/health") {
      if (method !== "GET") return errorResponse(405, "method_not_allowed", `use GET for ${path}`);
      return { status: 200, body: { status: "ok" } };
    }
    if (path === "/firings") {
      if (method === "GET") {
        return { status: 200, body: { bookings: [...bookings], loadKg, capacityKg: config.maxLoadKg } };
      }
      if (method === "POST") return book(body);
      return errorResponse(405, "method_not_allowed", `use GET or POST for ${path}`);
    }
    return errorResponse(404, "not_found", `nothing at ${path}`);
  };
}

// ---------- Server ----------

class BodyError extends Error {
  readonly response: ApiResponse;
  constructor(response: ApiResponse) {
    super("unusable request body");
    this.response = response;
  }
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size <= MAX_BODY_BYTES) chunks.push(chunk);
  }
  if (size > MAX_BODY_BYTES) {
    throw new BodyError(errorResponse(413, "payload_too_large", `bodies are limited to ${MAX_BODY_BYTES} bytes`));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new BodyError(errorResponse(400, "invalid_json", "the body is not valid JSON"));
  }
}

async function respond(request: IncomingMessage, handler: Handler): Promise<ApiResponse> {
  try {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    const body = await readBody(request);
    return await handler({ method: request.method ?? "GET", path: pathname, body });
  } catch (error) {
    if (error instanceof BodyError) return error.response;
    console.error("request failed:", error);
    return errorResponse(500, "internal", "internal error");
  }
}

export async function startServer(config: Config, handler: Handler = createHandler(config)): Promise<RunningServer> {
  const server = createServer(async (request, response) => {
    const result = await respond(request, handler);
    const headers: Record<string, string> = { "content-type": "application/json; charset=utf-8" };
    if (!server.listening) headers["connection"] = "close";
    response.writeHead(result.status, headers);
    response.end(JSON.stringify(result.body));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://${config.host}:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
