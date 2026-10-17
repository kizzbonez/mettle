import { MAX_BODY_BYTES, loadConfig, startServer, type Handler, type RunningServer } from "./solution.js";

const config = loadConfig({ KILN_PORT: "0", KILN_MAX_LOAD_KG: "20" });

async function call(server: RunningServer, method: string, path: string, body?: string): Promise<{ status: number; type: string; text: string }> {
  const response = await fetch(server.url + path, body === undefined ? { method } : { method, body });
  return { status: response.status, type: response.headers.get("content-type") ?? "", text: await response.text() };
}

function json(text: string, what: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return fail(`${what}: the response body is JSON`);
  }
}

function codeIn(text: string, what: string): unknown {
  return (json(text, what) as { error?: { code?: unknown } }).error?.code;
}

// 1. The real handler behind a real server on 127.0.0.1.
const server = await startServer(config);
try {
  check.true(/^http:\/\/127\.0\.0\.1:\d+$/.test(server.url), "url is http://127.0.0.1:<port>");
  check.true(!server.url.endsWith(":0"), "url names the port the server actually listens on, not 0");

  const health = await call(server, "GET", "/health");
  check.equal([health.status, json(health.text, "GET /health")], [200, { status: "ok" }], "GET /health over HTTP");
  check.true(health.type.startsWith("application/json"), "responses are sent as application/json");

  const created = await call(server, "POST", "/firings", JSON.stringify({ member: "Ines", pieces: 2, weightKg: 4, cone: "6" }));
  check.equal(
    [created.status, json(created.text, "POST /firings")],
    [201, { booking: { id: "B-1", member: "Ines", pieces: 2, weightKg: 4, cone: "6" } }],
    "POST /firings with a JSON body creates a booking",
  );

  const listed = await call(server, "GET", "/firings?week=42");
  check.equal(
    (json(listed.text, "GET /firings") as { bookings: unknown[] }).bookings.length,
    1,
    "the query string is not part of the path",
  );

  const broken = await call(server, "POST", "/firings", "{ member: Ines");
  check.equal([broken.status, codeIn(broken.text, "malformed JSON")], [400, "invalid_json"], "malformed JSON is answered with 400 invalid_json");

  const empty = await call(server, "POST", "/firings", "");
  check.equal([empty.status, codeIn(empty.text, "an empty body")], [400, "invalid_body"], "an empty body reaches the handler as undefined");

  const huge = await call(server, "POST", "/firings", "x".repeat(MAX_BODY_BYTES + 1));
  check.equal([huge.status, codeIn(huge.text, "a huge body")], [413, "payload_too_large"], "a body over MAX_BODY_BYTES is answered with 413");

  const padding = MAX_BODY_BYTES - JSON.stringify({ note: "" }).length;
  const atLimit = await call(server, "POST", "/firings", JSON.stringify({ note: "y".repeat(padding) }));
  check.equal(atLimit.status, 400, "a body of exactly MAX_BODY_BYTES bytes is still read");

  const missing = await call(server, "GET", "/kilns");
  check.equal([missing.status, codeIn(missing.text, "an unknown path")], [404, "not_found"], "unknown paths are answered with 404 over HTTP");
} finally {
  await server.close();
}

// 2. A handler that fails: a generic 500, nothing leaked, the server keeps serving.
let calls = 0;
const failing: Handler = async (request) => {
  calls += 1;
  if (request.path === "/boom") throw new Error("kiln controller password is hunter2");
  if (request.path === "/reject") return Promise.reject(new Error("hunter2 again"));
  return { status: 200, body: { path: request.path } };
};
const fragile = await startServer(config, failing);
try {
  for (const path of ["/boom", "/reject"]) {
    const crashed = await call(fragile, "GET", path);
    check.equal([crashed.status, codeIn(crashed.text, "a failing handler")], [500, "internal"], "a handler that throws or rejects gives 500 internal");
    check.true(!crashed.text.includes("hunter2"), "the 500 response does not reveal the error's message");
  }
  const after = await call(fragile, "GET", "/still-here");
  check.equal(after.status, 200, "the server keeps serving after a handler fails");
  calls = 0;
  await call(fragile, "POST", "/x", "{ nope");
  await call(fragile, "POST", "/x", "z".repeat(MAX_BODY_BYTES + 10));
  check.equal(calls, 0, "the handler is not called for malformed or oversized bodies");
} finally {
  await fragile.close();
}

// 3. Graceful shutdown: wait for the request in flight, refuse new ones, then finish promptly.
const entered = Promise.withResolvers<void>();
const release = Promise.withResolvers<void>();
const slow = await startServer(config, async (request) => {
  entered.resolve();
  await release.promise;
  return { status: 200, body: { done: request.path } };
});
const inFlight = fetch(`${slow.url}/firings`).then(
  async (response) => [response.status, await response.json()],
  () => "cut off",
);
await entered.promise;

let closed = false;
const closing = slow.close().then(() => {
  closed = true;
});
await new Promise((resolve) => setTimeout(resolve, 50));
check.true(!closed, "close() waits for the request in flight");
await check.rejects(() => fetch(`${slow.url}/health`), "a new connection after close() is refused");

release.resolve();
const answered = await inFlight;
check.true(answered !== "cut off", "the request in flight is answered, not cut off");
check.equal(answered, [200, { done: "/firings" }], "the request in flight gets its full response");

const outcome = await Promise.race([
  closing.then(() => "closed"),
  new Promise<string>((resolve) => setTimeout(() => resolve("still open"), 1000).unref()),
]);
check.equal(outcome, "closed", "close() finishes promptly once the last request is answered, even over a keep-alive connection");
