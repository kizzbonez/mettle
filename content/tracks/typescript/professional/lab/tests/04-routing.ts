import { createHandler, errorResponse, loadConfig, type ApiResponse, type ErrorCode } from "./solution.js";

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function codeOf(response: ApiResponse): string {
  return (response.body as ErrorBody).error.code;
}

check.equal(
  errorResponse(404, "not_found", "nothing at /kilns"),
  { status: 404, body: { error: { code: "not_found", message: "nothing at /kilns" } } },
  "errorResponse without details has no details property",
);
check.equal(
  errorResponse(400, "invalid_body", "bad", [{ field: "cone", problem: "unknown cone" }]),
  { status: 400, body: { error: { code: "invalid_body", message: "bad", details: [{ field: "cone", problem: "unknown cone" }] } } },
  "errorResponse with details includes them",
);

const handle = createHandler(loadConfig({ KILN_MAX_LOAD_KG: "20" }));
const post = (body: unknown): ApiResponse => handle({ method: "POST", path: "/firings", body });

for (const [method, path, status, code] of [
  ["GET", "/kilns", 404, "not_found"],
  ["GET", "/firings/", 404, "not_found"],
  ["GET", "/Firings", 404, "not_found"],
  ["GET", "/", 404, "not_found"],
  ["DELETE", "/firings", 405, "method_not_allowed"],
  ["PUT", "/firings", 405, "method_not_allowed"],
  ["POST", "/health", 405, "method_not_allowed"],
] as const) {
  const response = handle({ method, path, body: undefined });
  check.equal([response.status, codeOf(response)], [status, code], `${method} ${path} is answered with ${status}`);
}

const invalid = post({ member: "Ade", pieces: 3, weightKg: 1, cone: "6", price: 0 });
check.equal(invalid.status, 400, "a body with an unknown field is refused with 400");
const details = (invalid.body as ErrorBody).error.details as Record<string, unknown>[];
check.equal(
  details.map((detail) => [Object.keys(detail).sort(), detail["field"], typeof detail["problem"]]),
  [[["field", "problem"], "price", "string"]],
  "the details of an invalid body are the problems, as { field, problem } objects",
);
check.equal(codeOf(post("not an object")), "invalid_body", "a body that is not an object is invalid_body");

check.equal(post({ member: "Ade", pieces: 3, weightKg: 12.5, cone: "6" }).status, 201, "12.5 kg fits in a 20 kg kiln");
const tooMuch = post({ member: "Bo", pieces: 3, weightKg: 7.75, cone: "04" });
check.equal([tooMuch.status, codeOf(tooMuch)], [409, "kiln_full"], "7.75 kg more would be 20.25 kg, over capacity");
const exact = post({ member: "Bo", pieces: 3, weightKg: 7.5, cone: "04" });
check.equal(exact.status, 201, "a booking that fills the kiln exactly is accepted");
check.equal(
  (exact.body as { booking: { id: string } }).booking.id,
  "B-2",
  "refused bookings do not use up an id",
);
const nothingLeft = post({ member: "Cy", pieces: 1, weightKg: 0.25, cone: "10" });
check.equal(codeOf(nothingLeft), "kiln_full", "a full kiln refuses even the smallest booking");

const listing = handle({ method: "GET", path: "/firings", body: { ignored: true } }).body as {
  bookings: { id: string }[];
  loadKg: number;
  capacityKg: number;
};
check.equal(
  [listing.bookings.map((booking) => booking.id), listing.loadKg, listing.capacityKg],
  [["B-1", "B-2"], 20, 20],
  "GET /firings shows only the accepted bookings and the full load",
);

const other = createHandler(loadConfig({}));
const fresh = other({ method: "GET", path: "/firings", body: undefined }).body as { bookings: unknown[]; capacityKg: number };
check.equal([fresh.bookings.length, fresh.capacityKg], [0, 60], "each handler keeps its own bookings");
check.equal(
  (other({ method: "POST", path: "/firings", body: { member: "Di", pieces: 1, weightKg: 1, cone: "6" } }).body as { booking: { id: string } }).booking.id,
  "B-1",
  "each handler numbers its own bookings from B-1",
);

// Type checks only: this function is compiled, never called.
export function typesOnly(): ErrorCode {
  // @ts-expect-error "teapot" is not an error code
  errorResponse(418, "teapot", "short and stout");
  // @ts-expect-error error codes are exact strings
  const loose: ErrorCode = "Not_Found";
  return loose;
}
