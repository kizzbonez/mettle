Complete `solution.go`. Every function takes a `context.Context` as its first parameter, `ctx`.
`ErrTooSlow` is declared in the starter.

1. **`waitForPizza(ctx context.Context, oven <-chan string) (string, error)`** waits for a pizza
   to come out of the oven. When one arrives, return it and a nil error. If `ctx` ends first
   (cancelled, or past its deadline), return `""` and `ctx.Err()` at once, so that the caller can
   tell `context.Canceled` from `context.DeadlineExceeded` with `errors.Is`. Use one `select`.
2. **`bakeWithin(ctx context.Context, limit time.Duration, bake func(ctx context.Context) (string,
   error)) (string, error)`** gives one bake its own time limit:
   - derive a context from `ctx` that ends `limit` after now, with `ErrTooSlow` as its cause:
     `context.WithTimeoutCause`;
   - always cancel the derived context before `bakeWithin` returns (`defer cancel()`), so its
     timer is released even when the bake finishes early;
   - call `bake` with the **derived** context and return its pizza and error, with one exception:
     when `bake` returns an error **and** the derived context has ended, return `""` and
     `context.Cause` of the derived context instead. That is `ErrTooSlow` when the limit ran out,
     and the reason the caller's `ctx` ended when it ended first.
3. **`withTicket(ctx context.Context, ticket int) context.Context`** returns a context that
   carries the order's ticket number, and **`ticketFrom(ctx context.Context) (int, bool)`** returns
   the ticket number and `true`, or `0` and `false` when `ctx` carries none. Ticket 0 is a real
   ticket. Use a key of your own **unexported type** (for example `type ticketKey struct{}`), never
   a string or an int, so that other code storing a `"ticket"` value cannot clash with yours.

The tests run on a fake clock, so the minutes below take no real time, and check exactly when
each function returns.

Example:

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
defer cancel()
waitForPizza(ctx, oven)      // "margherita", nil, 3 min after the start, when the oven delivers
waitForPizza(ctx, quietOven) // "", context.DeadlineExceeded, 10 min after the start

// bake8 honours its context and takes 8 minutes; bake12 would take 12.
bakeWithin(context.Background(), 10*time.Minute, bake8)  // "diavola", nil, 8 min after the call
bakeWithin(context.Background(), 10*time.Minute, bake12) // "", ErrTooSlow, 10 min after the call

t := withTicket(context.Background(), 42)
ticketFrom(t)                    // 42, true
ticketFrom(context.Background()) // 0, false
```

A bake that honours its context looks like this:

```go
func(ctx context.Context) (string, error) {
	select {
	case <-time.After(8 * time.Minute):
		return "diavola", nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}
```
