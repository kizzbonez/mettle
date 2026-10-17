import { createHandler, errorReply } from "./solution.js";

// The example from the instructions, without the server.

const state = new Map([["w1", "free"], ["d2", "running"]]);
const handle = createHandler({
  "GET /machines": () => ({ status: 200, body: { machines: [...state.keys()] } }),
  "GET /machines/:id": ({ params }) =>
    state.has(params.id)
      ? { status: 200, body: { id: params.id, state: state.get(params.id) } }
      : errorReply(404, "not_found", `no machine ${params.id}`),
});

check.equal(handle("GET", "/machines/w1"), { status: 200, body: { id: "w1", state: "free" } }, "GET /machines/w1 passes the id to the handler");
check.equal(handle("GET", "/machines?floor=1"), { status: 200, body: { machines: ["w1", "d2"] } }, "the query string is not part of the path");

const wrongMethod = handle("DELETE", "/machines/w1");
check.equal(wrongMethod.status, 405, "a known path with another method answers 405");
check.equal((wrongMethod.body as { error: { code: string } }).error.code, "method_not_allowed", "the 405 carries the code method_not_allowed");

const unknown = handle("GET", "/dryers");
check.equal(unknown.status, 404, "an unknown path answers 404");
check.equal((unknown.body as { error: { code: string } }).error.code, "not_found", "the 404 carries the code not_found");
