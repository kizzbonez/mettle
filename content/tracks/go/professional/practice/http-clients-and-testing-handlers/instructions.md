Complete the client in `solution.go`. `Reading`, `ErrUnknownRegion`, `PollenClient`,
`newPollenClient` and `jitterWait` are written for you: `jitterWait` is the production `Wait`,
which sleeps a random time up to `d`. The tests give the client their own `Wait`, so they never
sleep.

1. **`(f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error)`** calls `f` with the
   request and returns what it returns, so any function of that shape can be a client's
   `Transport`. (The tests use it to fake network failures.)
2. **`backoffCap(n int) time.Duration`** is the longest wait before retry `n` (1 for the first
   retry): 100 ms, then doubled for each further retry, never more than 2 s. So 100 ms, 200 ms,
   400 ms, 800 ms, 1.6 s, then 2 s for retry 6 and every retry after it, even retry 1,000.
3. **`(c *PollenClient) Forecast(ctx context.Context, region string) ([]Reading, error)`**
   - Sends `GET <BaseURL>/regions/<region>/forecast` with `c.HTTP`, built with
     `http.NewRequestWithContext(ctx, ...)` and the header `Accept: application/json`. Escape
     the region with `url.PathEscape`: `Isle of Wight` becomes `Isle%20of%20Wight`.
   - **200**: decode the body, a JSON array of readings, and return it. A body that is not valid
     JSON is an error, and is not retried.
   - **404**: return an error that wraps `ErrUnknownRegion` (so `errors.Is` finds it). Do not retry.
   - **429 or any 5xx**, or an error from `c.HTTP.Do` (no response at all): try again, up to
     `c.Attempts` attempts in total. Before retry `n`, call `c.Wait(ctx, backoffCap(n))`. Never
     wait before the first attempt or after the last one. If `Wait` returns an error, stop and
     return an error that wraps it. When every attempt fails, return an error.
   - **Any other status** (400, 401, 403...): return an error naming the status. Do not retry.
   - Close the body of **every** response you receive, including the ones you retry.

```go
// A server that answers 503 once, then
// [{"day":"2026-05-14","grass":7,"tree":3},{"day":"2026-05-15","grass":9,"tree":2}]
var waits []time.Duration
c := &PollenClient{
	BaseURL:  srv.URL + "/api",
	HTTP:     srv.Client(),
	Attempts: 3,
	Wait: func(ctx context.Context, d time.Duration) error {
		waits = append(waits, d)
		return nil
	},
}
readings, err := c.Forecast(context.Background(), "Isle of Wight")
// readings: [{2026-05-14 7 3} {2026-05-15 9 2}], err: nil
// waits:    [100ms]   (one retry after the 503)
// The server saw GET /api/regions/Isle%20of%20Wight/forecast twice.
```
