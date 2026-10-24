---
title: "Context: Cancellation and Deadlines"
summary: Pass a context.Context as the first parameter, cancel work with WithCancel, bound it with WithTimeout and WithDeadline, say why with WithCancelCause and Cause, react with AfterFunc and WithoutCancel, and carry request-scoped values under typed keys.
minutes: 40
objectives:
  - Pass a context as the first parameter, starting from Background, TODO or t.Context
  - Stop work when ctx.Done() is closed and report ctx.Err() as context.Canceled or context.DeadlineExceeded
  - Derive contexts with WithCancel, WithTimeout, WithDeadline and WithCancelCause, always calling cancel, and read the reason with context.Cause
  - Store request-scoped values under an unexported key type, and use AfterFunc and WithoutCancel
---

## Outline

1. Why context exists
2. Context is the first parameter
3. Cancelling with WithCancel
4. Deadlines with WithTimeout and WithDeadline
5. Saying why with WithCancelCause
6. AfterFunc and WithoutCancel
7. Request-scoped values
8. Contexts in tests

## Why context exists

A request to a server starts work: a database query, a call to another service, a few
goroutines. If the client hangs up or a time limit passes, all of that work should stop, or it
piles up and the server runs out of resources. Lesson 03 stopped a loop with a quit channel;
**`context.Context`** is the standard version of that idea, shared by the whole standard library.
A context carries three things across API boundaries: a **cancellation signal**, an optional
**deadline**, and a few **request-scoped values**.

Its `Done()` method returns a channel that is closed when the work should stop, which you wait on
in a `select`. After that, `Err()` says why: `context.Canceled` ("context canceled") or
`context.DeadlineExceeded` ("context deadline exceeded"). Before it, `Err()` is nil.

## Context is the first parameter

A function that may block or take a while takes a context as its **first parameter, named `ctx`**,
and passes it to everything it calls. The package documentation adds rules worth learning by heart:

- Do not store a context in a struct; pass it to each call that needs it, so every call can have
  its own deadline.
- Never pass `nil`. `context.WithCancel(nil)` panics with `cannot create context from nil parent`.
- Start the chain with `context.Background()` in `main`, at the top of a request or in a test,
  and use `context.TODO()` where a context should exist but the code does not pass one yet.

Contexts form a tree: you **derive** a child from a parent, and when a parent is cancelled, every
context derived from it is cancelled too. A child never cancels its parent.

## Cancelling with WithCancel

`context.WithCancel(parent)` returns a child and a `cancel` function. Calling `cancel` closes the
child's `Done` channel:

```go
// deliver drives to stop, which takes drive, unless ctx ends first.
func deliver(ctx context.Context, stop string, drive time.Duration) error {
	select {
	case <-time.After(drive):
		fmt.Println("delivered to", stop)
		return nil
	case <-ctx.Done():
		return fmt.Errorf("delivery to %s: %w", stop, ctx.Err())
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(100 * time.Millisecond)
		cancel() // the customer cancels the order
	}()
	err := deliver(ctx, "12 Mill Lane", time.Second)
	fmt.Println(err)
	fmt.Println(errors.Is(err, context.Canceled))
}
```

```text
delivery to 12 Mill Lane: context canceled
true
```

Wrapping `ctx.Err()` with `%w` adds context while `errors.Is` still finds the cause (Medium 05).
Calling `cancel` again does nothing, so it is safe to call it whenever the work is over.

## Deadlines with WithTimeout and WithDeadline

`context.WithTimeout(parent, d)` cancels the child after `d`; `context.WithDeadline(parent, t)`
at the time `t`. Both return a `cancel` function too, and you must call it, normally with `defer`:
it releases the timer as soon as the work finishes early.

```go
func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	fmt.Println(deliver(ctx, "3 Quay Street", 50*time.Millisecond))
	fmt.Println(deliver(ctx, "8 Hill Road", time.Second))

	inner, cancelInner := context.WithTimeout(ctx, time.Hour)
	defer cancelInner()
	outerDeadline, _ := ctx.Deadline()
	innerDeadline, _ := inner.Deadline()
	fmt.Println("same deadline:", innerDeadline.Equal(outerDeadline))
}
```

```text
delivered to 3 Quay Street
<nil>
delivery to 8 Hill Road: context deadline exceeded
same deadline: true
```

One deadline covers the whole round: the second delivery got the 150 ms that were left. A child
can only shorten its parent's deadline, never extend it, so the hour-long `inner` keeps the
parent's. `ctx.Deadline()` reports the deadline and whether there is one.

## Saying why with WithCancelCause

`ctx.Err()` only says "cancelled" or "deadline exceeded". `context.WithCancelCause` returns a
cancel function that takes an error, and `context.Cause(ctx)` returns it. `WithTimeoutCause` and
`WithDeadlineCause` set the cause used when the time runs out:

```go
var errBreakdown = errors.New("the van broke down")
var errLate = errors.New("the round took too long")

func main() {
	ctx, cancel := context.WithCancelCause(context.Background())
	cancel(errBreakdown)
	fmt.Println(ctx.Err())
	fmt.Println(context.Cause(ctx))

	round, stop := context.WithTimeoutCause(context.Background(), 10*time.Millisecond, errLate)
	defer stop()
	<-round.Done()
	fmt.Println(round.Err(), "/", context.Cause(round))
}
```

```text
context canceled
the van broke down
context deadline exceeded / the round took too long
```

`Err` keeps its two standard values, so existing checks still work, and the cause adds the
detail. A cause set on a parent is also the cause of its children. With no cause given,
`Cause` returns the same as `Err`.

## AfterFunc and WithoutCancel

`context.AfterFunc(ctx, f)` runs `f` in its own goroutine once `ctx` is cancelled, and returns a
`stop` function that unregisters it. `context.WithoutCancel(parent)` keeps the parent's values
but is never cancelled, for work that must finish anyway, such as writing an audit log:

```go
func main() {
	ctx, cancel := context.WithCancel(context.Background())
	refunded := make(chan struct{})
	context.AfterFunc(ctx, func() {
		fmt.Println("refund issued")
		close(refunded)
	})
	audit := context.WithoutCancel(ctx)

	cancel()
	<-refunded
	fmt.Println("order:", ctx.Err())
	fmt.Println("audit log:", audit.Err())
}
```

```text
refund issued
order: context canceled
audit log: <nil>
```

## Request-scoped values

`context.WithValue(parent, key, value)` attaches a value that `ctx.Value(key)` finds again,
through every derived context. Use it only for **request-scoped data** that crosses API
boundaries, such as a request ID or the caller's identity, never for optional parameters.
Make the key your own **unexported type**, so no other package can build an equal key:

```go
// orderIDKey is the key for the order ID. The type is unexported, so no other package can
// build an equal key.
type orderIDKey struct{}

func withOrderID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, orderIDKey{}, id)
}

func orderID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(orderIDKey{}).(string)
	return id, ok
}

func main() {
	ctx := withOrderID(context.Background(), "A-1042")
	ctx = context.WithValue(ctx, "orderID", "from another package")
	fmt.Println(orderID(ctx))
	fmt.Println(orderID(context.Background()))
}
```

```text
A-1042 true
 false
```

The string key `"orderID"` does not clash with `orderIDKey{}`. Had you used the string as your
key, the other package's value would have replaced yours.

## Contexts in tests

Since Go 1.24, `t.Context()` gives each test a context that is cancelled just before the test's
cleanup functions run, so work a test starts cannot outlive it:

```go
func TestDeliver(t *testing.T) {
	if err := deliver(t.Context(), "1 Test Street", time.Millisecond); err != nil {
		t.Fatal(err)
	}
}
```

```text
=== RUN   TestDeliver
delivered to 1 Test Street
--- PASS: TestDeliver (0.00s)
```

## Common mistakes

- **Not calling `cancel`.** The timer lives until the deadline. `go vet` reports `the cancel
  function returned by context.WithTimeout should be called, not discarded, to avoid a context
  leak`, but `go test` does not run that check, so run `go vet` yourself. Write `defer cancel()`
  on the next line.
- **A context in a struct.** Every call then shares one deadline. Pass `ctx` to each method.
- **String keys.** Two packages that both use `"user"` overwrite each other. Use an unexported
  key type.
- **Ignoring `Done` in long work.** A loop that never checks `ctx` cannot be stopped. Check
  `ctx.Done()` in its `select`, or `ctx.Err()` between steps.

## Practice

1. Write `waitTurn(ctx context.Context, turn <-chan int) (int, error)` that returns the next
   number or `ctx.Err()`.
2. Give a call a limit of 50 ms, with the cause "kitchen too slow". What do `Err` and `Cause`
   print when it runs out?
3. Is the deadline of `context.WithTimeout(parent, time.Hour)` an hour away when `parent` has
   10 ms left?

### Answers

```go
func waitTurn(ctx context.Context, turn <-chan int) (int, error) {
	select {
	case n := <-turn:
		return n, nil
	case <-ctx.Done():
		return 0, ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeoutCause(context.Background(), 50*time.Millisecond, errors.New("kitchen too slow"))
	defer cancel()
	fmt.Println(waitTurn(ctx, make(chan int)))
	fmt.Println(context.Cause(ctx))
}
```

```text
0 context deadline exceeded
kitchen too slow
```

For 3: no. A child's deadline is never later than its parent's, so it ends with the parent.

## Key takeaways

- `ctx context.Context` comes first, is passed down, and is never stored or nil.
- Wait on `ctx.Done()` in a `select`; `ctx.Err()` is `Canceled` or `DeadlineExceeded`.
- `WithCancel`, `WithTimeout` and `WithDeadline` derive children; always `defer cancel()`.
- `WithCancelCause` and the `...Cause` variants record why; `context.Cause` reads it.
- `WithValue` only for request-scoped data, under an unexported key type.

## Further reading

- [Package context](https://pkg.go.dev/context)
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
- [Contexts and structs](https://go.dev/blog/context-and-structs)
