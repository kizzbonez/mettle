Keep the other types and `errorReply` as they are. The tests build route tables of their own,
call your handle directly, and then serve it over real HTTP with `fetch`.

1. **`RouteKey`**: replace the placeholder with a template literal type: one of the `Method`
   strings, one space, then a path starting with `/`. A route table with the key
   `"FETCH /machines"` or `"GET machines"` must then be a compile error.
2. **`matchPath(pattern: string, path: string): Record<string, string> | null`** splits both at
   `/` and compares segment by segment. They must have the same number of segments, so
   `/machines/` does not match `/machines`. A segment written `:name` in the pattern matches
   any **non-empty** segment and records it under `name`; any other segment must be equal.
   Return the recorded parameters (`{}` when there are none), or `null` when the path does not
   match.
3. **`createHandler(routes: Routes): Handle`** returns `(method, url) => Reply`. Take the path
   and the query from `new URL(url, "http://localhost")`, then go through the routes in the
   table's order (a key is split at its first space into method and pattern):
   - the first route whose pattern matches the path **and** whose method is the request's
     (compared exactly, as HTTP does) is called with `{ params, query }`, and its reply is
     returned;
   - if that handler throws, log the error with `console.error` and return
     `errorReply(500, "internal", "internal error")`: the error's message must never reach the
     client;
   - if some pattern matched the path but no route had the method, return a `405` with code
     `"method_not_allowed"`; if no pattern matched at all, a `404` with code `"not_found"`.
     Write those messages as you like.
4. **`startServer(handle: Handle): Promise<RunningServer>`** creates a `node:http` server that
   answers every request with `handle(request.method, request.url)`, sending the reply's status
   and its body as JSON with the header `content-type: application/json; charset=utf-8`. If
   `handle` throws, answer `500` with `errorReply(500, "internal", "internal error")`. Listen on
   port `0` of `127.0.0.1` and resolve, once listening, with `url` set to
   `http://127.0.0.1:<port>` (the port really chosen) and `close()`, which resolves when the
   server has closed.

Example:

```ts
const state = new Map([["w1", "free"], ["d2", "running"]]);
const handle = createHandler({
  "GET /machines": () => ({ status: 200, body: { machines: [...state.keys()] } }),
  "GET /machines/:id": ({ params }) =>
    state.has(params.id)
      ? { status: 200, body: { id: params.id, state: state.get(params.id) } }
      : errorReply(404, "not_found", `no machine ${params.id}`),
});
handle("GET", "/machines/w1")        // { status: 200, body: { id: "w1", state: "free" } }
handle("GET", "/machines?floor=1")   // { status: 200, body: { machines: ["w1", "d2"] } }
handle("DELETE", "/machines/w1")     // 405, body { error: { code: "method_not_allowed", message: "..." } }
handle("GET", "/dryers")             // 404, body { error: { code: "not_found", message: "..." } }

const server = await startServer(handle);
const reply = await fetch(`${server.url}/machines/d2`);   // 200, {"id":"d2","state":"running"}
await server.close();
```

**Tip:** `server.address()` returns an `AddressInfo` for a TCP server, and `once` from
`node:events` turns the `"listening"` event into a promise.
