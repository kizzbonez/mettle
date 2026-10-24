Write the four tasks in `solution.go`. The starter already contains, and the tests rely on:
the `Booking` type and the `Store` interface with `newMemoryStore`, the errors `ErrNotFound`
and `ErrBerthTaken`, the helpers `writeJSON` and `writeError` (which sends
`{"error":"..."}`), the types `Config` and `bookingRequest`, the variable `version`, and a
finished `main` that wires your functions together and shuts down gracefully on a signal.
Keep those as they are; add any functions and types of your own.

## 1. Configuration

**`loadConfig(args []string, getenv func(string) (string, bool)) (Config, error)`**. `args`
are the command-line arguments without the program name, and `getenv` works like
`os.LookupEnv` (`main` passes exactly that), so the tests can give both without touching the
real process.

| Setting      | Flag        | Environment variable   | Default |
| ------------ | ----------- | ---------------------- | ------- |
| `Addr`       | `-addr`     | `MOORINGS_ADDR`        | `:8080` |
| `Berths`     | `-berths`   | `MOORINGS_BERTHS`      | `12`    |
| `MaxBody`    | `-max-body` | `MOORINGS_MAX_BODY`    | `4096`  |
| `AdminToken` | none        | `MOORINGS_ADMIN_TOKEN` | none    |

- A flag wins over the environment, which wins over the default. Use a `flag.FlagSet` with
  `flag.ContinueOnError` (and `SetOutput(io.Discard)`), and return the error of `Parse`, so an
  unknown flag such as `-admin-token` is an error: secrets never go in flags.
- An environment value that is not a number gives an error naming the variable, such as
  `MOORINGS_BERTHS: "lots" is not a number`.
- Then validate, in this order, with exactly these errors:
  `berths must be between 1 and 200`, `max-body must be between 256 and 1048576`, and
  `MOORINGS_ADMIN_TOKEN must be set to at least 16 characters`.

## 2. Routes and handlers

**`newServer(cfg Config, store Store, logger *slog.Logger) http.Handler`** registers these
routes on a new `http.ServeMux`, with Go 1.22 patterns, and returns the mux wrapped as
`logRequests(logger, recoverPanics(logger, mux))`. Every response with a body is JSON, sent
with `writeJSON` or `writeError`; requests use `r.Context()` when calling the store.

- **`GET /healthz`**: 200 and `{"status":"ok","version":"<version>"}`, from the `version`
  variable.
- **`POST /bookings`**: read the body through `http.MaxBytesReader` with `cfg.MaxBody`, and
  decode it into a `bookingRequest` with a `json.Decoder` that disallows unknown fields
  (so a request that sends its own `"id"` is refused). The body must hold exactly one JSON
  value: decode once more and expect `io.EOF`.
  - Body over the limit: **413** `request body too large` (the error is an
    `*http.MaxBytesError`: use `errors.AsType`). Any other decoding problem: **400**
    `invalid JSON body`.
  - Then check the fields in this order and answer **422** with the first problem:

    | Rule | Error |
    | ---- | ----- |
    | `boat`, with the spaces around it removed, is not empty | `boat is required` |
    | `boat` has at most 40 characters (runes, not bytes) | `boat must be at most 40 characters` |
    | `length_m` is more than 0 and at most 20 | `length_m must be more than 0 and at most 20` |
    | `berth` is from 1 to `cfg.Berths` | `berth must be between 1 and 12` (with the real number) |
    | `arrive` parses with `time.DateOnly` | `arrive must be a date like 2026-07-04` |
    | `nights` is from 1 to 14 | `nights must be between 1 and 14` |

  - Store the trimmed boat name with `store.Add`. `ErrBerthTaken` gives **409**
    `berth is taken for those nights`; any other error **500** `internal error` (log the error
    itself with `logger`, never send it to the client).
  - Success: **201**, the header `Location: /bookings/<id>`, and the stored booking as JSON.
- **`GET /bookings/{id}`**: 200 and the booking; `ErrNotFound` gives **404**
  `booking not found`; other errors 500 as above.
- **`DELETE /bookings/{id}`**: first check the header `Authorization: Bearer <token>`: the
  token after exactly `Bearer ` must equal `cfg.AdminToken`, compared with
  `subtle.ConstantTimeCompare`. Otherwise **401** `unauthorized`, before looking anything up.
  Then cancel: **204** with no body, or 404 `booking not found`.

The `ServeMux` answers 405 for a wrong method and 404 for an unknown path by itself.

## 3. Middleware

- **`logRequests(logger *slog.Logger, next http.Handler) http.Handler`** calls `next`, then
  logs one line at level Info with the message `request` and exactly the attributes `method`,
  `path` (`r.URL.Path`, so never the query) and `status` (an int). To know the status, pass
  `next` a wrapper around the `ResponseWriter` that remembers the code given to
  `WriteHeader`; a handler that only calls `Write`, or writes nothing, has status 200. Never
  log headers: they hold the token.
- **`recoverPanics(logger *slog.Logger, next http.Handler) http.Handler`** calls `next` with a
  deferred `recover`. After a panic, it logs at level Error the message `panic` with exactly
  the attributes `path` and `panic` (the panic value as text, `fmt.Sprint(v)`), and answers
  **500** `internal error`.

## 4. The server

**`newHTTPServer(cfg Config, h http.Handler) *http.Server`** returns a server with `Addr`
from `cfg`, `Handler` `h`, `ReadHeaderTimeout` 5 s, `ReadTimeout` 10 s, `WriteTimeout` 10 s
and `IdleTimeout` 60 s.

## Example

```text
loadConfig([]string{"-berths", "8"}, env with MOORINGS_ADMIN_TOKEN=pier-head-7f3a9c2e)
  -> Config{Addr: ":8080", Berths: 8, MaxBody: 4096, AdminToken: "pier-head-7f3a9c2e"}

POST /bookings   {"boat":"Sea Pie","length_m":9.5,"berth":3,"arrive":"2026-07-04","nights":2}
  -> 201, Location: /bookings/b1
     {"id":"b1","boat":"Sea Pie","length_m":9.5,"berth":3,"arrive":"2026-07-04","nights":2}
GET /bookings/b1  -> 200, the same booking
DELETE /bookings/b1 with Authorization: Bearer pier-head-7f3a9c2e  -> 204
GET /bookings/b1  -> 404 {"error":"booking not found"}
GET /healthz      -> 200 {"status":"ok","version":"dev"}
```

The log line of the `POST`, from a JSON handler with the time removed:

```json
{"level":"INFO","msg":"request","method":"POST","path":"/bookings","status":201}
```

**Tips.** Write `loadConfig` and test it on its own first. Keep the handlers small: a struct
that holds `cfg`, `store` and `logger`, with one method per route, keeps `newServer` short. The
tests use `httptest.NewRecorder` and one `httptest.NewServer` on the loopback interface.
