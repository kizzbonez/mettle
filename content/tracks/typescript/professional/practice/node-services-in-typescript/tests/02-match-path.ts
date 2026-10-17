import { matchPath, type RouteHandler, type RouteKey, type Routes } from "./solution.js";

// The route key type.
const ok: RouteHandler = () => ({ status: 200, body: null });
const keys: RouteKey[] = ["GET /machines", "POST /machines/:id/start", "DELETE /machines/:id/hold", "GET /"];
check.equal(keys.length, 4, "RouteKey accepts each method followed by a path");
const routes: Routes = { "GET /machines": ok, "DELETE /machines/:id": ok };
check.equal(Object.keys(routes).length, 2, "a route table with valid keys");
// @ts-expect-error FETCH is not one of the methods
const badMethod: Routes = { "FETCH /machines": ok };
// @ts-expect-error a path must start with a slash
const noSlash: Routes = { "GET machines": ok };
// @ts-expect-error a lowercase method is not one of the methods
const lowercase: RouteKey = "get /machines";
void [badMethod, noSlash, lowercase]; // rejected by the compiler; nothing to check at run time

// Literal segments.
check.equal(matchPath("/machines", "/machines"), {}, "an exact path without parameters");
check.equal(matchPath("/", "/"), {}, "the root path");
check.equal(matchPath("/machines", "/dryers"), null, "a different segment");
check.equal(matchPath("/machines", "/machines/"), null, "a trailing slash is another path");
check.equal(matchPath("/machines/", "/machines"), null, "a pattern with a trailing slash");
check.equal(matchPath("/machines", "/Machines"), null, "segments are compared with case");
check.equal(matchPath("/machines/free", "/machines"), null, "a shorter path");
check.equal(matchPath("/machines", "/machines/free"), null, "a longer path");

// Parameters.
check.equal(matchPath("/machines/:id", "/machines/w1"), { id: "w1" }, "one parameter");
check.equal(
  matchPath("/floors/:floor/machines/:id/start", "/floors/2/machines/d7/start"),
  { floor: "2", id: "d7" },
  "two parameters between literal segments",
);
check.equal(matchPath("/machines/:id", "/machines/"), null, "a parameter never matches an empty segment");
check.equal(matchPath("/machines/:id", "/machines/w1/start"), null, "a parameter matches one segment only");
check.equal(matchPath("/machines/:id/start", "/machines/w1/stop"), null, "a literal segment after a parameter must match");
check.equal(matchPath("/:what", "/machines"), { what: "machines" }, "a parameter as the first segment");
check.equal(matchPath("/machines/:id", "/machines/dryer%201"), { id: "dryer%201" }, "the segment is recorded as written");
