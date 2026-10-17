import { createHandler, errorReply, type Reply, type RouteInput } from "./solution.js";

function codeOf(reply: Reply): unknown {
  return (reply.body as { error?: { code?: unknown } }).error?.code;
}

const seen: string[] = [];
let lastInput: RouteInput | undefined;

const handle = createHandler({
  "GET /machines/free": () => ({ status: 200, body: { route: "free list" } }),
  "GET /machines/:id": (input) => {
    lastInput = input;
    return { status: 200, body: { route: "one machine", id: input.params.id } };
  },
  "POST /machines/:id/start": ({ params, query }) => {
    const minutes = Number(query.get("minutes"));
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 90) {
      return errorReply(400, "bad_request", "minutes must be a whole number from 1 to 90");
    }
    seen.push(`${params.id} for ${minutes}`);
    return { status: 202, body: { id: params.id, minutes } };
  },
  "DELETE /machines/:id/hold": () => {
    throw new Error("database password is spin-cycle-42");
  },
  "GET /machines/:id/hold": () => ({ status: 200, body: { held: false } }),
});

// The first matching route in the table wins.
check.equal(handle("GET", "/machines/free").body, { route: "free list" }, "a literal route listed first wins over a parameter route");
check.equal(handle("GET", "/machines/w4").body, { route: "one machine", id: "w4" }, "the parameter route answers other ids");

// The handler receives the parameters and the query.
handle("GET", "/machines/d2?detail=full&detail=short");
check.equal(lastInput?.params, { id: "d2" }, "params holds the recorded parameters");
check.equal(lastInput?.query.getAll("detail"), ["full", "short"], "query holds the parsed query string");
check.true(lastInput?.query instanceof URLSearchParams, "query is a URLSearchParams");

// A handler that validates its query.
check.equal(handle("POST", "/machines/w1/start?minutes=45"), { status: 202, body: { id: "w1", minutes: 45 } }, "a valid start");
check.equal(codeOf(handle("POST", "/machines/w1/start?minutes=forty")), "bad_request", "the handler's own 400 is returned as it is");
check.equal(seen, ["w1 for 45"], "the handler ran once for the valid start");

// 405 and 404.
for (const [method, url] of [["PUT", "/machines/w1"], ["POST", "/machines/w1"], ["GET", "/machines/w1/start"], ["get", "/machines/w1"]]) {
  const reply = handle(method, url);
  check.equal([reply.status, codeOf(reply)], [405, "method_not_allowed"], `${method} ${url} is a known path with another method`);
}
for (const url of ["/", "/machines", "/machines/", "/machines/w1/start/now", "/dryers/w1"]) {
  const reply = handle("GET", url);
  check.equal([reply.status, codeOf(reply)], [404, "not_found"], `GET ${url} matches no pattern`);
}
check.equal(typeof (handle("GET", "/dryers").body as { error: { message: unknown } }).error.message, "string", "every error has a message");

// A handler that throws: a generic 500, nothing leaked, the next request still works.
const crashed = handle("DELETE", "/machines/w1/hold");
check.equal(crashed, { status: 500, body: { error: { code: "internal", message: "internal error" } } }, "a throwing handler gives the generic 500");
check.true(!JSON.stringify(crashed).includes("spin-cycle-42"), "the 500 does not reveal the error's message");
check.equal(handle("GET", "/machines/w1/hold").body, { held: false }, "the same path with another method still works afterwards");
