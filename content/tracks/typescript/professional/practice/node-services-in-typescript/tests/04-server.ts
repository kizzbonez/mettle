import { createHandler, startServer, type Handle, type RunningServer } from "./solution.js";

async function call(server: RunningServer, method: string, path: string): Promise<{ status: number; type: string | null; body: unknown }> {
  const response = await fetch(server.url + path, { method });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(`${method} ${path}: the response body is JSON`);
  }
  return { status: response.status, type: response.headers.get("content-type"), body };
}

// 1. A route table behind a real server.
const handle = createHandler({
  "GET /machines": () => ({ status: 200, body: { machines: ["w1", "w2", "d1"] } }),
  "POST /machines/:id/start": ({ params, query }) => ({ status: 202, body: { id: params.id, minutes: Number(query.get("minutes")) } }),
  "GET /machines/:id/fault": () => {
    throw new Error("coin box key is 7731");
  },
});

const board = await startServer(handle);
try {
  check.true(/^http:\/\/127\.0\.0\.1:\d+$/.test(board.url), "url is http://127.0.0.1:<port>");
  check.true(!board.url.endsWith(":0"), "url names the port the server really listens on");

  const list = await call(board, "GET", "/machines");
  check.equal([list.status, list.body], [200, { machines: ["w1", "w2", "d1"] }], "GET /machines over HTTP");
  check.equal(list.type, "application/json; charset=utf-8", "the content-type header of a reply");

  const start = await call(board, "POST", "/machines/w2/start?minutes=30");
  check.equal([start.status, start.body], [202, { id: "w2", minutes: 30 }], "POST with a path parameter and a query over HTTP");

  const wrong = await call(board, "DELETE", "/machines");
  check.equal([wrong.status, (wrong.body as { error: { code: string } }).error.code], [405, "method_not_allowed"], "405 over HTTP");
  check.equal(wrong.type, "application/json; charset=utf-8", "errors are JSON too");

  const missing = await call(board, "GET", "/dryers");
  check.equal([missing.status, (missing.body as { error: { code: string } }).error.code], [404, "not_found"], "404 over HTTP");

  const fault = await call(board, "GET", "/machines/d1/fault");
  check.equal([fault.status, fault.body], [500, { error: { code: "internal", message: "internal error" } }], "a throwing route gives the generic 500 over HTTP");
  check.true(!JSON.stringify(fault.body).includes("7731"), "the 500 does not reveal the error's message");
} finally {
  await board.close();
}

// 2. A handle of its own: it receives the method and the whole URL, and may throw itself.
const raw: Handle = (method, url) => {
  if (url === "/boom") throw new Error("attendant pin 0420");
  return { status: 200, body: { method, url } };
};
const echo = await startServer(raw);
try {
  const got = await call(echo, "GET", "/machines/w1?detail=full");
  check.equal(got.body, { method: "GET", url: "/machines/w1?detail=full" }, "handle receives the method and the URL with its query");
  const posted = await call(echo, "POST", "/machines");
  check.equal(posted.body, { method: "POST", url: "/machines" }, "handle receives POST as the method");
  const boom = await call(echo, "GET", "/boom");
  check.equal([boom.status, boom.body], [500, { error: { code: "internal", message: "internal error" } }], "a handle that throws gives the generic 500");
  check.true(!JSON.stringify(boom.body).includes("0420"), "that 500 does not reveal the error's message either");
  const after = await call(echo, "GET", "/still-here");
  check.equal(after.status, 200, "the server keeps serving after a handle threw");
} finally {
  await echo.close();
}
check.true(true, "close() resolved for both servers");
