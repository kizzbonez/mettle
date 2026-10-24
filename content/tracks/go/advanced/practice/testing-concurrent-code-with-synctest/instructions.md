The school's gate timer, `gateWait`, is already written in `solution.go`. Your job is to write
the **checks** that prove a wait behaves, in the way lesson 07 tests code: inside
`synctest.Test`, on the fake clock. The hidden tests run your checks against `gateWait`, against
other correct waits, and against broken ones. A check must return `nil` for every correct wait
and an error for every broken one.

Add `"fmt"` and `"testing/synctest"` to the imports. Each check:

- calls `synctest.Test(t, func(t *testing.T) { ... })` once, records the first problem it finds
  in a variable declared outside the bubble, and returns that variable after `synctest.Test`;
- never calls `t.Error`, `t.Fatal` or `t.Log`: a problem is returned as an error (any message
  you like, `fmt.Errorf` is handy);
- starts `wait` in a goroutine that sends its result on a channel with room for one value, and
  looks at that channel with a `select` that has a `default` case, never with a plain variable;
- moves the fake clock with `synctest.Sleep`, and calls `synctest.Wait()` after closing `arrived`
  or cancelling, so that `wait` has had its chance to return before you look;
- before the bubble ends, receives the result if it has not received it yet, so that the
  goroutine has finished. A broken wait may return much later than it should, but it always
  returns.

Use a limit of 10 minutes in every check, and `errors.Is` to compare errors: a correct wait may
wrap `errLate` or the context's error.

1. **`checkArrival(t *testing.T, wait waitFunc) error`**: the grown-up arrives (close `arrived`)
   3 minutes 30 seconds after the start. Until then, `wait` must not have returned; as soon as
   `arrived` is closed, it must have returned `nil`.
2. **`checkLimit(t *testing.T, wait waitFunc) error`**: nobody arrives. One nanosecond before the
   limit, `wait` must not have returned; at the limit it must have returned an error that is
   `errLate`.
3. **`checkCancel(t *testing.T, wait waitFunc) error`**: nobody arrives, and the context you give
   `wait` (make it with `context.WithCancel(t.Context())`) is cancelled 4 minutes after the
   start. Until then, `wait` must not have returned; straight after the cancel it must have
   returned an error that is `context.Canceled`.

Example: what the checks should report for three waits.

```go
checkArrival(t, gateWait) // nil
checkLimit(t, gateWait)   // nil
checkCancel(t, gateWait)  // nil

// Returns at once, without waiting at all.
impatient := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
	return nil
}
checkArrival(t, impatient) // an error: wait returned <nil> before anyone arrived
checkLimit(t, impatient)   // an error
checkCancel(t, impatient)  // an error

// Forgets the context, so a cancel does not stop it.
deaf := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
	return gateWait(context.Background(), arrived, limit)
}
checkArrival(t, deaf) // nil
checkLimit(t, deaf)   // nil
checkCancel(t, deaf)  // an error: wait did not return when its context was cancelled
```
