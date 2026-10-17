import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

// ---------- Types ----------
// Step 1: make Cone, ErrorCode and ValidationResult as exact as the instructions describe.
// The placeholders below type-check, but they accept far too much.

export type Cone = string;

export type ErrorCode = string;

export type ValidationResult = {
  readonly ok: boolean;
  readonly booking?: BookingRequest;
  readonly problems?: readonly FieldProblem[];
};

// These types are complete.

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

// Step 2: read KILN_HOST, KILN_PORT and KILN_MAX_LOAD_KG; throw one ConfigError listing every problem.
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  throw new Error("Not implemented");
}

// ---------- Validation ----------

// Step 3: check an unknown request body field by field.
export function validateBooking(body: unknown): ValidationResult {
  throw new Error("Not implemented");
}

// ---------- Handler ----------

// Step 4: the one shape every error response has.
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: readonly FieldProblem[],
): ApiResponse {
  throw new Error("Not implemented");
}

// Step 5: GET /health, GET /firings and POST /firings, with this handler's own bookings.
export function createHandler(config: Config): (request: ApiRequest) => ApiResponse {
  throw new Error("Not implemented");
}

// ---------- Server ----------

// Step 6: serve a handler over HTTP; read bodies with a limit; close gracefully.
// createServer, IncomingMessage and AddressInfo are imported above for you.
export async function startServer(config: Config, handler: Handler = createHandler(config)): Promise<RunningServer> {
  throw new Error("Not implemented");
}
