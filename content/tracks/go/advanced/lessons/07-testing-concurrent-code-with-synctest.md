---
title: Testing Concurrent Code with synctest
summary: Test timeouts, timers, tickers and goroutines deterministically and instantly with testing/synctest, its fake clock, synctest.Wait and Go 1.27's synctest.Sleep, and let it catch the goroutines your code leaks.
minutes: 35
objectives:
  - Explain why tests that sleep on the real clock are slow and flaky
  - Run a test in a synctest bubble and predict when its fake clock advances
  - Check that something has not happened yet, and then has, with synctest.Sleep and a channel
  - Recognise synctest's deadlock report for a leaked goroutine, and know when to inject a clock instead
---

## Outline

1. Why sleeping in tests goes wrong
2. A bubble with a fake clock
3. When the fake clock moves: durably blocked
4. Checking "not yet" with synctest.Sleep
5. Tickers, t.Context and leaked goroutines
6. When synctest cannot help

## Why sleeping in tests goes wrong

Here is a function with a timeout, built from lesson 05's `context.WithTimeout`:

```go
// fetch waits for an answer on reply, but gives up after limit.
func fetch(ctx context.Context, reply <-chan string, limit time.Duration) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, limit)
	defer cancel()
	select {
	case answer := <-reply:
		return answer, nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}
```

Testing it on the real clock means waiting for real:

```go
func TestFetchGivesUp(t *testing.T) {
	_, err := fetch(t.Context(), make(chan string), 2*time.Second)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("err = %v, want DeadlineExceeded", err)
	}
}

func TestFetchAnswer(t *testing.T) {
	reply := make(chan string)
	go func() {
		time.Sleep(1900 * time.Millisecond) // just inside the limit
		reply <- "pong"
	}()
	got, err := fetch(t.Context(), reply, 2*time.Second)
	if err != nil || got != "pong" {
		t.Fatalf("fetch = %q, %v", got, err)
	}
}
```

```text
=== RUN   TestFetchGivesUp
--- PASS: TestFetchGivesUp (2.00s)
=== RUN   TestFetchAnswer
--- PASS: TestFetchAnswer (1.90s)
PASS
ok  	example	3.956s
```

Four seconds for two tests is the small problem. The big one is that `TestFetchAnswer` is
**flaky**: it passes or fails depending on how busy the machine is. On a loaded build server the
goroutine can start 100 ms late, and the test fails though the code is right. Widening the gap
makes the test slower; narrowing it makes it fail more often.

## A bubble with a fake clock

Package `testing/synctest`, standard since Go 1.25, removes both problems.
`synctest.Test(t, func(t *testing.T) { ... })` runs the function in a **bubble**: that goroutine
and every goroutine it starts. Inside a bubble, the `time` package uses a **fake clock** that
starts at midnight UTC on 1 January 2000 and moves only when the bubble has nothing else to do.

```go
func TestFetchGivesUp(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		start := time.Now()
		_, err := fetch(t.Context(), make(chan string), 2*time.Second)
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("err = %v, want DeadlineExceeded", err)
		}
		t.Log("started at", start, "and gave up after", time.Since(start))
	})
}
```

```text
=== RUN   TestFetchGivesUp
    fetch_test.go:18: started at 2000-01-01 00:00:00 +0000 UTC and gave up after 2s
--- PASS: TestFetchGivesUp (0.00s)
```

The test took no real time, and `time.Since(start)` is exactly 2s, every run. You can now test
the edge exactly: an answer sent after `2*time.Second - time.Nanosecond` of fake sleep is
always in time. `synctest.Test` returns only when every goroutine in the bubble has ended.

## When the fake clock moves: durably blocked

A goroutine is **durably blocked** when only another goroutine in the same bubble can wake it.
When every goroutine in the bubble is durably blocked, the clock jumps straight to the next
timer, which wakes someone. These count:

- sending or receiving on a channel created inside the bubble, and a `select` whose cases are
  all such channels;
- `time.Sleep`, `sync.Cond.Wait`, and `sync.WaitGroup.Wait` when `Add` or `Go` ran in the bubble.

These do not, because something outside could end them: locking a `sync.Mutex`, reading a
network socket or a file, a system call, and a channel made outside the bubble. A goroutine
waiting on one of those stops the clock. Waiting on a package-level channel makes the test hang
until `go test` gives up (here run with `-timeout=3s`):

```text
panic: test timed out after 3s
	running tests:
		TestOutsideChannel (3s)
```

Create the channels, timers and contexts of a test inside its bubble.

## Checking "not yet" with synctest.Sleep

**`synctest.Wait()`** blocks until every other goroutine in the bubble is durably blocked: the
bubble has settled, so you can look at the results. Go 1.27 added **`synctest.Sleep(d)`**, which
is exactly `time.Sleep(d)` followed by `synctest.Wait()`. Use it whenever the test and the code
wake at the same moment, because without the `Wait` either one might run first.

To check that `fetch` does not give up a nanosecond early, and does at the limit, run it in a
goroutine that reports on a channel, and look with a non-blocking `select`:

```go
func TestGivesUpAtTheLimit(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		done := make(chan error, 1)
		go func() {
			_, err := fetch(t.Context(), make(chan string), 2*time.Second)
			done <- err
		}()

		synctest.Sleep(2*time.Second - time.Nanosecond)
		select {
		case <-done:
			t.Fatal("fetch gave up before the limit")
		default: // still waiting, as it should be
		}

		synctest.Sleep(time.Nanosecond)
		select {
		case err := <-done:
			if !errors.Is(err, context.DeadlineExceeded) {
				t.Fatalf("err = %v, want DeadlineExceeded", err)
			}
		default:
			t.Fatal("fetch did not give up at the limit")
		}
	})
}
```

```text
=== RUN   TestGivesUpAtTheLimit
--- PASS: TestGivesUpAtTheLimit (0.00s)
```

It passes 20 times out of 20 with `-count=20`. The channel matters. `synctest.Wait` makes what a
goroutine wrote before it blocked visible to the race detector, but reading a plain `done` flag
*before* the goroutine sets it is still a data race. A channel or an atomic is always safe.

## Tickers, t.Context and leaked goroutines

Tickers run on the fake clock too:

```go
// heartbeat sends a beat number every interval until ctx is done.
func heartbeat(ctx context.Context, every time.Duration, beats chan<- int) {
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for n := 1; ; n++ {
		select {
		case <-ticker.C:
			beats <- n
		case <-ctx.Done():
			return
		}
	}
}

func TestHeartbeat(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		beats := make(chan int, 10)
		go heartbeat(context.Background(), 30*time.Second, beats)

		synctest.Sleep(95 * time.Second)
		if got := len(beats); got != 3 {
			t.Errorf("after 95s: %d beats, want 3", got)
		}
	})
}
```

```text
--- FAIL: TestHeartbeat (0.00s)
panic: deadlock: main bubble goroutine has exited but blocked goroutines remain [recovered, repanicked]
...
goroutine 23 [select (durable), synctest bubble 1]:
example.heartbeat({0x7e9e18, 0x835300}, 0x6fc23ac00, 0xc0000f0000)
	/work/beat.go:13 +0x1ad
```

Three beats arrived, but the test fails: when the test function returned, `heartbeat` was still
waiting for its next tick, and nothing in the bubble would ever end it. `synctest.Test` turns
every leaked goroutine into a failure and prints where it is stuck, a free leak check. Passing
`t.Context()` instead of `context.Background()` fixes it: that context is cancelled when the test
function returns, `heartbeat` sees `ctx.Done()`, and the test passes.

## When synctest cannot help

The bubble's rules exclude real I/O. Go 1.27 adds `httptest.NewTestServer(t, handler)`, which
serves over an in-memory network that works inside a bubble. For code whose goroutines are not in
the bubble, or whose blocking is not durable, **inject a clock** instead: give the type a
`now func() time.Time` field, `time.Now` in production and a function returning a fixed time in
tests, as in Medium lesson 13. Keep the race detector on either way (`go test -race`): every
test in this course runs under it.

## Common mistakes

- **`time.Sleep` where you need `synctest.Sleep`.** When the test and the code wake at the same
  fake instant, the test may look first: `fetch did not give up at the limit`, followed by
  `WARNING: DATA RACE`. Sleep with `synctest.Sleep`, or call `synctest.Wait()` after `time.Sleep`.
- **Sharing a plain variable with the goroutine under test.** Reading it before the goroutine has
  written it is a race even inside a bubble. Report through a channel or an atomic.
- **Background goroutines on `context.Background()`.** They outlive the test function and fail
  with `deadlock: main bubble goroutine has exited but blocked goroutines remain`. Use
  `t.Context()` or cancel them yourself.
- **Channels made outside the bubble.** A package-level channel or one made before
  `synctest.Test` is not durably blocking, so the clock never moves and the test times out.

## Practice

1. In a bubble, start a goroutine that sleeps one second and then logs `time.Since(start)`, while
   the test itself sleeps two seconds. What is logged, and in which order?
2. `TestHeartbeat` sleeps 95 seconds. Would `synctest.Sleep(90 * time.Second)` also always see
   three beats? Would `time.Sleep(90 * time.Second)`?
3. Write a test that `fetch` returns `"pong"` when the answer comes at 1.5 seconds.

### Answers

1. The goroutine logs `1s`, then the test logs `2s`. Every goroutine is asleep, so the clock jumps
to one second and wakes the goroutine first.

2. At 90 seconds the third tick and the test wake at the same instant. `synctest.Sleep` waits
for `heartbeat` to send and block again, so it always sees 3. With `time.Sleep`, 30 runs saw 3
beats 23 times and 2 beats 7 times.

```go
func TestFetchAnswer(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		reply := make(chan string)
		go func() {
			time.Sleep(1500 * time.Millisecond)
			reply <- "pong"
		}()
		got, err := fetch(t.Context(), reply, 2*time.Second)
		if err != nil || got != "pong" {
			t.Fatalf("fetch = %q, %v", got, err)
		}
	})
}
```

```text
=== RUN   TestFetchAnswer
--- PASS: TestFetchAnswer (0.00s)
```

## Key takeaways

- Real sleeps make concurrent tests slow and flaky; a synctest bubble makes them instant and exact.
- The fake clock starts at 2000-01-01 00:00 UTC and advances only when every goroutine in the
  bubble is durably blocked.
- Channels made in the bubble, `time.Sleep`, `WaitGroup.Wait` and `Cond.Wait` block durably;
  mutexes, I/O and outside channels do not.
- `synctest.Sleep(d)` is `time.Sleep(d)` plus `synctest.Wait()`; report results over channels.
- A goroutine still blocked when the test function returns fails the test, with its stack.

## Further reading

- [Package testing/synctest](https://pkg.go.dev/testing/synctest)
- [The Go Blog: Testing concurrent code with testing/synctest](https://go.dev/blog/synctest)
- [Go 1.27 release notes](https://go.dev/doc/go1.27)
