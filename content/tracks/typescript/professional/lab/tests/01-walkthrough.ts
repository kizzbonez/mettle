import { createHandler, loadConfig } from "./solution.js";

// The walkthrough from the instructions: defaults, then one evening of bookings on a 30 kg kiln.

const defaults = loadConfig({});
check.equal(
  { host: defaults.host, port: defaults.port, maxLoadKg: defaults.maxLoadKg },
  { host: "127.0.0.1", port: 8080, maxLoadKg: 60 },
  "loadConfig({}) uses the default host, port and load",
);

const handle = createHandler(loadConfig({ KILN_MAX_LOAD_KG: "30" }));

check.equal(
  handle({ method: "GET", path: "/health", body: undefined }),
  { status: 200, body: { status: "ok" } },
  "GET /health answers 200 with { status: \"ok\" }",
);

const ines = handle({
  method: "POST",
  path: "/firings",
  body: { member: "  Ines Duarte ", pieces: 6, weightKg: 12.5, cone: "6" },
});
check.equal(
  ines,
  { status: 201, body: { booking: { id: "B-1", member: "Ines Duarte", pieces: 6, weightKg: 12.5, cone: "6" } } },
  "the first valid booking is created as B-1 with the member's name trimmed",
);

const tomas = handle({
  method: "POST",
  path: "/firings",
  body: { member: "Tomas", pieces: 4, weightKg: 15, cone: "06" },
});
check.equal(tomas.status, 201, "a second booking that still fits is created");

const full = handle({
  method: "POST",
  path: "/firings",
  body: { member: "Wen", pieces: 2, weightKg: 5, cone: "10" },
});
const fullBody = full.body as { error: { code: string; message: string } };
check.equal(full.status, 409, "a booking that would overload the kiln is refused with 409");
check.equal(fullBody.error.code, "kiln_full", "the refusal carries the code kiln_full");
check.equal(typeof fullBody.error.message, "string", "every error has a message");

const invalid = handle({
  method: "POST",
  path: "/firings",
  body: { member: "Ade", pieces: 0, weightKg: 2, cone: "5" },
});
const invalidBody = invalid.body as { error: { code: string; details: { field: string }[] } };
check.equal(invalid.status, 400, "an invalid booking is refused with 400");
check.equal(invalidBody.error.code, "invalid_body", "the refusal carries the code invalid_body");
check.equal(
  invalidBody.error.details.map((detail) => detail.field),
  ["pieces", "cone"],
  "the details name every field with a problem, in order",
);

check.equal(
  handle({ method: "GET", path: "/firings", body: undefined }),
  {
    status: 200,
    body: {
      bookings: [
        { id: "B-1", member: "Ines Duarte", pieces: 6, weightKg: 12.5, cone: "6" },
        { id: "B-2", member: "Tomas", pieces: 4, weightKg: 15, cone: "06" },
      ],
      loadKg: 27.5,
      capacityKg: 30,
    },
  },
  "GET /firings lists the accepted bookings with the load and the capacity",
);
