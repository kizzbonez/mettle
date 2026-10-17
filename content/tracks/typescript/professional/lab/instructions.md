Write `solution.ts`. The starter declares every type, constant and function the tests import;
keep their names and signatures, and keep them exported. You may add functions, classes and
constants of your own. Do not start a server or read `process.env` at the top level: the tests
import your file and call what they need.

1. **Types.** Replace the three placeholders:
   - `Cone` is exactly one of the strings `"06"`, `"04"`, `"6"` and `"10"`.
   - `ErrorCode` is exactly one of `"invalid_body"`, `"invalid_json"`, `"payload_too_large"`,
     `"not_found"`, `"method_not_allowed"`, `"kiln_full"` and `"internal"`.
   - `ValidationResult` is a discriminated union: `{ readonly ok: true; readonly booking:
     BookingRequest }` or `{ readonly ok: false; readonly problems: readonly FieldProblem[] }`, so
     code can only read `booking` after checking `ok`.

   Tests check these types: a cone such as `"5"`, a code such as `"teapot"`, reading `booking`
   without checking `ok`, and assigning to a `Config` property must all be compile errors.
2. **`loadConfig(env)`** reads three variables from `env` (the tests pass plain objects; a real
   start would pass `process.env`). Spaces around a value are ignored.
   - `KILN_HOST`: default `"127.0.0.1"`; when set, it must not be empty.
   - `KILN_PORT`: default `8080`; when set, it must be written with digits only and be from `0`
     to `65535` (`0` means any free port). `"1e3"`, `"80.5"`, `"-1"` and `""` are problems.
   - `KILN_MAX_LOAD_KG`: default `60`; when set, digits with an optional decimal part such as
     `"72.5"`, above `0` and at most `500`.

   Check all three, then, if anything was wrong, throw **one** `ConfigError` whose `problems`
   lists one string per bad variable, in the order host, port, load. Each string starts with
   the variable's name and a space, for example `KILN_PORT must be a whole number from 0 to
   65535, got "eighty"`. Otherwise return the `Config`, frozen with `Object.freeze`.
3. **`validateBooking(body)`** checks a parsed JSON body of type `unknown`:
   - If `body` is not a plain object (it is `null`, an array, a string, a number or `undefined`),
     return `ok: false` with the single problem `{ field: "body", ... }`.
   - Otherwise check, in this order, and add one `{ field, problem }` per failing field:
     `member` (a string of 1 to 40 characters after trimming), `pieces` (a whole number from 1
     to 20), `weightKg` (a finite number above 0 and at most 25), `cone` (exactly one of the
     `Cone` strings). Then add a problem for every other key of the body, in the order the keys
     appear, with the key as `field`. The `problem` text is yours to word.
   - With no problems, return `ok: true` and a booking with the member's name trimmed.
4. **`errorResponse(status, code, message, details?)`** returns `{ status, body: { error: {
   code, message, details } } }`. Leave the `details` property out entirely when no details are
   given.
5. **`createHandler(config)`** returns a function that answers an `ApiRequest`. Each handler
   keeps its own list of bookings, starting empty. Paths match exactly, so `/firings/` is not
   `/firings`.

   | Request | Response |
   | --- | --- |
   | `GET /health` | `200`, `{ status: "ok" }` |
   | `GET /firings` | `200`, `{ bookings, loadKg, capacityKg }`: the accepted bookings in order, their total weight, and `config.maxLoadKg` |
   | `POST /firings`, body not valid | `400`, code `invalid_body`, the problems as `details` |
   | `POST /firings`, would make the load exceed `maxLoadKg` | `409`, code `kiln_full` (filling it exactly is allowed) |
   | `POST /firings`, otherwise | `201`, `{ booking }` with `id` `"B-1"`, `"B-2"`, ... counting accepted bookings only |
   | `/health` or `/firings` with another method | `405`, code `method_not_allowed` |
   | any other path | `404`, code `not_found` |

   Every error response is built with `errorResponse`; only `invalid_body` has `details`.
6. **`startServer(config, handler)`** serves `handler` (by default `createHandler(config)`) with
   `node:http` on `config.host` and `config.port`, and resolves once the server is listening,
   with a `RunningServer`:
   - `url` is `http://<host>:<port>` with the port the server really listens on, which matters
     when `config.port` is `0`.
   - For each request, call the handler with the method, the path from the URL without the query
     string, and the body: `undefined` when the body is empty, otherwise the parsed JSON.
   - A body larger than `MAX_BODY_BYTES` bytes is answered `413` with `payload_too_large`, and a
     body that is not valid JSON `400` with `invalid_json`; the handler is not called for either.
   - If the handler throws or its promise rejects, answer `500` with code `internal` and a
     generic message that does not contain the error's message (log it if you like), and keep
     serving.
   - Send every response body as JSON with the header `content-type: application/json;
     charset=utf-8`.
   - `close()` stops accepting connections at once, lets requests already in progress finish and
     receive their full responses, and resolves when the server has closed. It must resolve
     promptly after the last response even when the client keeps its connection alive, as
     `fetch` does. Lesson 6 shows the trap and its fix.

Example, a 30 kg kiln:

```ts
const handle = createHandler(loadConfig({ KILN_MAX_LOAD_KG: "30" }));
handle({ method: "GET", path: "/health", body: undefined });
// { status: 200, body: { status: "ok" } }
handle({ method: "POST", path: "/firings", body: { member: "  Ines Duarte ", pieces: 6, weightKg: 12.5, cone: "6" } });
// { status: 201, body: { booking: { id: "B-1", member: "Ines Duarte", pieces: 6, weightKg: 12.5, cone: "6" } } }
handle({ method: "POST", path: "/firings", body: { member: "Tomas", pieces: 4, weightKg: 15, cone: "06" } });
// 201, booking B-2; the load is now 27.5 kg
handle({ method: "POST", path: "/firings", body: { member: "Wen", pieces: 2, weightKg: 5, cone: "10" } });
// 409, { error: { code: "kiln_full", message: "..." } }
handle({ method: "POST", path: "/firings", body: { member: "Ade", pieces: 0, weightKg: 2, cone: "5" } });
// 400, { error: { code: "invalid_body", message: "...", details: [{ field: "pieces", ... }, { field: "cone", ... }] } }
handle({ method: "GET", path: "/firings", body: undefined });
// 200, { bookings: [B-1, B-2], loadKg: 27.5, capacityKg: 30 }

const server = await startServer(loadConfig({ KILN_PORT: "0" }));
const reply = await fetch(`${server.url}/health`);   // 200, {"status":"ok"}
await server.close();
```

**Tips.** Write the types first and let them guide the rest: once `ValidationResult` is a
discriminated union, the compiler tells you when you forget to check `ok`. Test `loadConfig`
with a value that `Number` accepts but the rules do not, such as `"1e3"`. For the server, start
from lesson 6: read the body with a limit, keep the handler's failures from reaching the client,
and remember that `server.listening` turns `false` as soon as `close()` is called.
