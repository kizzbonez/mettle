---
title: HTTP Clients and Testing Handlers
summary: Call HTTP APIs with a configured Client, contexts, status checks and closed bodies, retry safely with backoff and jitter, and test both handlers and clients with httptest and fake transports.
minutes: 40
objectives:
  - Make requests with a Client that has a timeout and a context, check the status and close the body
  - Retry idempotent requests with exponential backoff and full jitter, and say which failures to retry
  - Test handlers table-driven with httptest.NewRecorder, and clients with httptest.NewServer
  - Fake a server with a custom RoundTripper for errors that a real server cannot easily produce
---

## Outline

1. A client that cannot hang
2. Statuses, bodies and JSON
3. Retries with backoff and jitter
4. Testing handlers with a recorder
5. Testing clients: a real test server or a fake transport
6. Smaller details: URL.Clone and cookies

## A client that cannot hang

`http.Get(url)` uses `http.DefaultClient`, whose `Timeout` is zero: no timeout. If the server
never answers, your goroutine waits forever, and under load the waiting goroutines pile up until
the service falls over. Create one `http.Client` with a `Timeout` and reuse it: it keeps a pool
of open connections and is safe for concurrent use. `Timeout` covers the whole exchange, from
connecting to reading the last byte of the body.

`http.NewRequestWithContext` ties a request to the caller's **context** (Advanced lesson 05), so
when an incoming request is cancelled, the calls made for it stop too. The `Timeout` is a
ceiling; the context is the caller's budget.

## Statuses, bodies and JSON

Two rules surprise newcomers. First, `Do` returns an error only when no response arrived (a
refused connection, a timeout); a 404 or a 500 is a response with `err == nil`, so always check
`resp.StatusCode`. Second, you must close `resp.Body`: an open body holds its connection, so it
cannot be reused. Since Go 1.27, closing an HTTP/1 body also reads what is left of it, up to a
limit, so the connection can be reused, but you still have to call `Close`.

```go
type Forecast struct {
	Harbour string  `json:"harbour"`
	WaveM   float64 `json:"wave_m"`
}

func fetchForecast(ctx context.Context, c *http.Client, base *url.URL, harbour string) (Forecast, error) {
	u := base.JoinPath("forecasts", harbour)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return Forecast{}, err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.Do(req)
	if err != nil {
		return Forecast{}, fmt.Errorf("forecast for %s: %w", harbour, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return Forecast{}, fmt.Errorf("forecast for %s: unexpected status %s", harbour, resp.Status)
	}
	var f Forecast
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&f); err != nil {
		return Forecast{}, fmt.Errorf("forecast for %s: %w", harbour, err)
	}
	return f, nil
}
```

`io.LimitReader` guards against a server that sends far more than expected. Against a test
server with a `whitby` forecast, no `oban` route and a `slow` handler that never answers, using
`&http.Client{Timeout: 200 * time.Millisecond}` and printing the timeout's `*url.Error`:

```text
whitby: {Harbour:whitby WaveM:1.4} <nil>
oban: {Harbour: WaveM:0} forecast for oban: unexpected status 404 Not Found
slow: timeout=true, context deadline exceeded (Client.Timeout exceeded while awaiting headers)
```

## Retries with backoff and jitter

Networks fail briefly, so a client may try again, but only when that is safe. An **idempotent**
request has the same effect whether it runs once or three times: GET, HEAD, PUT and DELETE are
meant to be. Retrying a POST that timed out may create the order twice. Retry network errors,
429 and 5xx; never other 4xx errors, which fail the same way every time.

Wait longer after each failure (**exponential backoff**: 100 ms, 200 ms, 400 ms...) up to a cap,
and pick a random wait between zero and that value (**full jitter**), so a thousand clients that
failed together do not retry together and knock the server over again.

```go
// backoff returns how long to wait before retry number n (1, 2, 3...): a random
// duration up to base doubled n-1 times, never above limit ("full jitter").
func backoff(n int, base, limit time.Duration, rnd *rand.Rand) time.Duration {
	d := limit
	if n < 30 && base<<(n-1) < limit {
		d = base << (n - 1)
	}
	return time.Duration(rnd.Int64N(int64(d) + 1))
}

// getWithRetry sends a GET until it gets a response that is not 429 or 5xx.
func getWithRetry(ctx context.Context, c *http.Client, url string, attempts int, rnd *rand.Rand) (*http.Response, error) {
	var lastErr error
	for n := range attempts {
		if n > 0 {
			select {
			case <-time.After(backoff(n, 10*time.Millisecond, time.Second, rnd)):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}
		resp, err := c.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode != http.StatusTooManyRequests && resp.StatusCode < 500 {
			return resp, nil
		}
		resp.Body.Close()
		lastErr = fmt.Errorf("status %s", resp.Status)
	}
	return nil, fmt.Errorf("after %d attempts: %w", attempts, lastErr)
}
```

The `n < 30` check stops the shift from overflowing. Printing six backoffs from a seeded
`rand.New(rand.NewPCG(1, 2))`, then calling a server that answers 503 twice before succeeding,
with 2 and then 4 attempts:

```text
77ms 123ms 314ms 637ms 375ms 82ms 
after 2 attempts: status 503 Service Unavailable
200 OK after 3 calls
```

A failed attempt's body is closed before the next try, and the wait listens to `ctx.Done()`, so
a cancelled caller is not kept waiting.

## Testing handlers with a recorder

`httptest.NewRequest` builds an incoming request and `httptest.NewRecorder` records what the
handler writes. Run the handler through its mux, because `r.PathValue` is filled in only when a
pattern matched. A table of cases with `t.Run` (Medium lesson 10) covers the edges cheaply:

```go
func TestTideHandler(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /tides/{day}", tideHandler)
	tests := []struct {
		name, path string
		wantCode   int
		wantBody   string
	}{
		{"first day", "/tides/1", 200, "high water on day 1 at 06:01\n"},
		{"last day", "/tides/31", 200, "high water on day 31 at 06:31\n"},
		{"day zero", "/tides/0", 400, "day must be 1 to 31\n"},
		{"not a number", "/tides/monday", 400, "day must be 1 to 31\n"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, httptest.NewRequest("GET", tt.path, nil))
			if rec.Code != tt.wantCode || rec.Body.String() != tt.wantBody {
				t.Errorf("GET %s = %d %q, want %d %q", tt.path, rec.Code, rec.Body, tt.wantCode, tt.wantBody)
			}
		})
	}
}
```

## Testing clients: a real test server or a fake transport

`httptest.NewServer(handler)` starts a real server on a loopback port and gives you `srv.URL`
and `srv.Client()`; close it with `defer srv.Close()`. It tests your client code end to end,
headers and status codes included. Some failures are hard to produce with a real server, such as
"the network is down". A client sends every request through its `Transport`, an
`http.RoundTripper` with one method, so a function type can stand in for the network:

```go
type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestFetchTextErrors(t *testing.T) {
	down := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		return nil, errors.New("network is down")
	})}
	if _, err := fetchText(down, "http://tides.example/tides/3"); err == nil {
		t.Error("want an error when the network is down")
	}

	busy := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusServiceUnavailable,
			Status:     "503 Service Unavailable",
			Body:       io.NopCloser(strings.NewReader("busy")),
			Request:    r,
		}, nil
	})}
	_, err := fetchText(busy, "http://tides.example/tides/3")
	t.Log("busy server:", err)
	if err == nil || !strings.Contains(err.Error(), "503") {
		t.Errorf("err = %v, want one naming the 503 status", err)
	}
}
```

With a third test that calls a real `httptest.NewServer`, `go test -race -v .` prints (the
lines for `TestTideHandler` and its subtests are cut):

```text
=== RUN   TestFetchTextErrors
    tides_test.go:58: busy server: unexpected status 503 Service Unavailable
--- PASS: TestFetchTextErrors (0.00s)
=== RUN   TestFetchTextRealServer
--- PASS: TestFetchTextRealServer (0.01s)
PASS
```

## Smaller details: URL.Clone and cookies

Go 1.27's `URL.Clone` and `Values.Clone` make deep copies: clone a shared base URL or query
before changing it for one request (`url.Values` is a map, so plain assignment shares it). A
client keeps cookies only with a `Jar` (`net/http/cookiejar`); since Go 1.26 it scopes them by
`Request.Host` when that is set.

## Common mistakes

- **Using `http.Get` or a `Client{}` without a timeout in a service.** One slow dependency
  hangs every caller. Set `Timeout` and pass a context.
- **Treating `err == nil` as success.** A 500 is not an error to `Do`; check `StatusCode`.
- **Forgetting `resp.Body.Close()`**, or closing before checking `err` (the response is nil
  then, and `resp.Body` panics with a nil pointer dereference).
- **Checking headers with `rec.Header()`.** It is the handler's live map, so a header set too
  late, after `WriteHeader`, still shows there as `"application/json"`, while
  `rec.Result().Header` gives `""`, as a client would see. Assert on `rec.Result()`.

## Practice

1. Which of these should a client retry: a timeout on GET, 503 on GET, 400 on GET, a timeout on
   POST /orders?
2. Why must `backoff` guard the shift for large `n`?
3. Why test a handler through a mux rather than by calling it directly?

### Answers

1. The GET timeout and the 503. A 400 will fail again; the POST may already have created the
   order, so retry it only if the API offers an idempotency key.
2. `base << (n-1)` overflows `int64`: with a base of 100 ms (10^8 ns), a shift by 29 is still
   fine and a shift by 39 wraps to a negative wait.

```go
base := 100 * time.Millisecond
fmt.Println(base<<29, base<<39)
```

```text
14913h4m51.2s -101291h53m52.328654848s
```

3. `r.PathValue` is empty unless a mux matched a pattern, and the 405 rules live in the mux.

## Key takeaways

- One shared `http.Client` with a `Timeout`; every request with a context.
- Check the status, close the body, limit what you read.
- Retry only idempotent requests, on network errors, 429 and 5xx, with capped exponential
  backoff and full jitter, and stop when the context ends.
- `NewRecorder` for handlers, `NewServer` for clients, a `RoundTripper` fake for failures.

## Further reading

- [net/http: Client](https://pkg.go.dev/net/http#Client)
- [net/http/httptest](https://pkg.go.dev/net/http/httptest)
- [Go by Example: HTTP Client](https://gobyexample.com/http-client)
- [Learn Go with Tests: HTTP Server](https://quii.gitbook.io/learn-go-with-tests/build-an-application/http-server)
