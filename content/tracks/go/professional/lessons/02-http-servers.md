---
title: HTTP Servers
summary: Build HTTP services with net/http alone, routing with Go 1.22 ServeMux patterns, sending and validating JSON safely, adding middleware, and configuring a Server that cannot be held open forever.
minutes: 40
objectives:
  - Route requests with method and wildcard patterns, read r.PathValue, and predict which pattern wins
  - Write JSON responses with the right status and headers, and validate JSON bodies with a size limit
  - Write middleware as func(http.Handler) http.Handler for logging and panic recovery
  - Configure http.Server timeouts and CrossOriginProtection, and explain what each one prevents
---

## Outline

1. Handlers
2. Routing with ServeMux patterns
3. Writing JSON responses
4. Reading and validating JSON bodies
5. Middleware
6. The Server and its timeouts
7. Cross-origin protection

## Handlers

Everything in `net/http` is built on one small interface:

```go
type Handler interface {
	ServeHTTP(http.ResponseWriter, *http.Request)
}
```

A **handler** receives the request and writes the response through the `ResponseWriter`. Most
handlers are plain functions; `http.HandlerFunc` is a function type with a `ServeHTTP` method,
the adapter pattern from Advanced lesson 10, so any `func(w, r)` becomes a `Handler`. The
standard library is enough for production services: many teams never add a web framework.

## Routing with ServeMux patterns

A **ServeMux** maps patterns to handlers. Since Go 1.22, a pattern can name a method and contain
**wildcards**: `{id}` matches one path segment, `{file...}` matches the rest of the path, and
`{$}` matches only the end of the path. The handler reads a wildcard with `r.PathValue`.
`httptest.NewRecorder` is a `ResponseWriter` that records the response, so you can call a
handler without a network:

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /bikes/{id}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "bike %s", r.PathValue("id"))
	})
	mux.HandleFunc("GET /bikes/spare", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "the spare bike")
	})
	mux.HandleFunc("GET /maps/{file...}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "map %s", r.PathValue("file"))
	})
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "home")
	})

	for _, target := range []string{"GET /bikes/7", "GET /bikes/spare", "DELETE /bikes/7",
		"GET /maps/north/a4.pdf", "GET /", "GET /bikes"} {
		method, path, _ := strings.Cut(target, " ")
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, httptest.NewRequest(method, path, nil))
		fmt.Printf("%-22s %d %q\n", target, rec.Code, rec.Body.String())
	}
}
```

```text
GET /bikes/7           200 "bike 7"
GET /bikes/spare       200 "the spare bike"
DELETE /bikes/7        405 "Method Not Allowed\n"
GET /maps/north/a4.pdf 200 "map north/a4.pdf"
GET /                  200 "home"
GET /bikes             404 "404 page not found\n"
```

When two patterns match, the **most specific** one wins, whatever the order of registration:
`/bikes/spare` matches a subset of what `/bikes/{id}` matches. A `GET` pattern also serves `HEAD`.
A path that matches with the wrong method gets 405 with an `Allow: GET, HEAD` header, so
handlers no longer check `r.Method` themselves. Without `{$}`, the pattern `/` would match every
path. Two patterns where neither is more specific are a bug, and registering the second panics:

```text
panic: pattern "GET /{kind}/7" (registered at /work/main.go:8) conflicts with pattern "GET /bikes/{id}" (registered at /work/main.go:7):
	GET /{kind}/7 and GET /bikes/{id} both match some paths, like "/bikes/7".
	But neither is more specific than the other.
```

A pattern ending in a slash, such as `GET /racks/`, matches the whole subtree, and a request for
`/racks` is redirected to `/racks/`; since Go 1.26 that redirect is a 307 instead of a 301.

## Writing JSON responses

A response has three parts, written in a fixed order: headers, then the status line, then the
body. `w.WriteHeader(status)` sends the status and freezes the headers; the first `Write` calls
`WriteHeader(200)` for you if you have not. So set `Content-Type` first, then the status, then
encode. One helper keeps every handler right (it is the first function in the next example).
Choose status codes that tell the client what to do: 201 for created, 400 for a body that is not
valid JSON, 404 for an unknown resource, 413 for a body that is too large, 422 for valid JSON
that breaks a rule, 409 for a conflict with the current state.

## Reading and validating JSON bodies

A client controls the body, so never read it without a limit. `http.MaxBytesReader` wraps the
body and fails reads past the limit with an `*http.MaxBytesError`. `DisallowUnknownFields`
rejects fields you did not expect, which catches misspelled names early. Then check the values:

```go
type hireRequest struct {
	BikeID string `json:"bike_id"`
	Hours  int    `json:"hours"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write response: %v", err) // too late to change the status
	}
}

func hire(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	var req hireRequest
	if err := dec.Decode(&req); err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "body over 1 KiB"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if req.BikeID == "" || req.Hours < 1 || req.Hours > 8 {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "need bike_id and 1 to 8 hours"})
		return
	}
	writeJSON(w, http.StatusCreated, req)
}
```

Sent five bodies (a good one, 12 hours, an extra `discount` field, cut-off JSON, a 2,000-character
ID) through a recorder, it answers:

```text
201 {"bike_id":"B7","hours":2}
422 {"error":"need bike_id and 1 to 8 hours"}
400 {"error":"json: unknown field \"discount\""}
400 {"error":"unexpected EOF"}
413 {"error":"body over 1 KiB"}
```

`log.Printf` is the standard logger; lesson 04 replaces it with structured logging.

## Middleware

**Middleware** is a function that takes a handler and returns a handler that does something
before or after calling it: `func(http.Handler) http.Handler`. Logging needs the status code,
which `ResponseWriter` does not expose, so the logger wraps the writer in a type that embeds it
(Medium lesson 04) and remembers the code. Recovery uses `defer` and `recover` from Medium lesson
06, so one buggy handler returns a 500 instead of a broken connection:

```go
type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func logRequests(out io.Writer, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		fmt.Fprintf(out, "%s %s -> %d\n", r.Method, r.URL.Path, sw.status)
	})
}

func recoverPanics(out io.Writer, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				fmt.Fprintln(out, "recovered:", v)
				http.Error(w, "internal error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
```

## The Server and its timeouts

`http.ListenAndServe(addr, h)` uses a `Server` with no timeouts, so a client that sends its
headers one byte a minute holds a connection, and a goroutine, forever. Build the `Server`
yourself. `ReadHeaderTimeout` limits reading the headers, `ReadTimeout` the whole request,
`WriteTimeout` writing the response, and `IdleTimeout` how long a keep-alive connection may
wait for its next request. This program wires the middleware above around a mux with
`GET /bikes/{id}` and a `GET /broken` route that writes to a nil map, serves on a loopback
port and calls itself:

```go
	srv := &http.Server{
		Handler:           logRequests(os.Stdout, recoverPanics(os.Stdout, mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	go func() { _ = srv.Serve(ln) }() // returns http.ErrServerClosed after Close
	defer srv.Close()
	// ... http.Get of /bikes/12 and /broken, printing each response
```

```text
GET /bikes/12 -> 200
client: 200 OK, bike 12
recovered: assignment to entry in nil map
GET /broken -> 500
client: 500 Internal Server Error, internal error
```

Port 0 asks the system for a free port; a real service listens on a configured address with
`srv.ListenAndServe()`. Lesson 05 adds a graceful shutdown.

## Cross-origin protection

A browser sends cookies with a form a hostile site posts to your service. Go 1.25's
`http.NewCrossOriginProtection().Handler(mux)` rejects unsafe methods (POST, PUT, DELETE...) from
other origins, using the browser's `Sec-Fetch-Site` header or `Origin`, with 403 and
`cross-origin request detected from Sec-Fetch-Site header`. GET, HEAD and OPTIONS always pass,
so they must never change data.

## Common mistakes

- **No `return` after an error.** `http.Error(w, "missing id", 400)` followed by more code sends
  `missing id` and the success body together, and the server logs `http: superfluous
  response.WriteHeader call`. Return straight after writing an error.
- **Setting a header after `WriteHeader`.** It is silently dropped: the client gets
  `text/plain; charset=utf-8` instead of `application/json`. Set headers first.
- **Decoding a body without `MaxBytesReader`.** One huge request can exhaust memory.
- **`http.ListenAndServe` in production.** No timeouts. Build an `http.Server`.

## Practice

1. With `GET /bikes/{id}` registered, what status does `HEAD /bikes/3` get?
2. Write middleware `requireJSON` that answers 415 to a POST whose `Content-Type` is not
   `application/json`.
3. Which `Server` field stops a client from opening a connection and sending headers slowly?

### Answers

```go
func requireJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.Header.Get("Content-Type") != "application/json" {
			http.Error(w, "send application/json", http.StatusUnsupportedMediaType)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

Wrapped around a mux with `POST /hires` and `GET /bikes/{id}`:

```text
POST application/json: 200 "hired"
POST text/plain: 415 "send application/json\n"
HEAD /bikes/3: 200
```

A `GET` pattern serves `HEAD` too (1). A real check would parse parameters such as
`; charset=utf-8` with `mime.ParseMediaType` (2). `ReadHeaderTimeout` (3).

## Key takeaways

- Patterns carry the method and wildcards; the most specific match wins; conflicts panic.
- Headers, then status, then body. Return after every error response.
- Limit, decode strictly and validate every body; map failures to 400, 413 and 422.
- Middleware is `func(http.Handler) http.Handler`; recover panics at the outermost layer you own.
- Always set the Server's timeouts.

## Further reading

- [net/http package](https://pkg.go.dev/net/http)
- [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements)
- [Go by Example: HTTP Server](https://gobyexample.com/http-server)
