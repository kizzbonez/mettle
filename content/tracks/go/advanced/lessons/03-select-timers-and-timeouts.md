---
title: select, Timers and Timeouts
summary: Wait on several channels at once with select, make non-blocking sends and receives with default, put time limits on waits with time.After and timers, pace a loop with a ticker until a quit signal, and switch cases off with nil channels.
minutes: 35
objectives:
  - Use select to wait on several channel operations and explain how it chooses between ready cases
  - Make non-blocking sends and receives with default, and add timeouts with time.After
  - Use time.NewTimer with Stop and Reset, and time.NewTicker in a loop with a quit channel
  - Describe the Go 1.23 timer semantics and disable a select case with a nil channel
---

## Outline

1. select waits on several channels
2. default: operations that never block
3. Timeouts with time.After
4. Timers: Stop and Reset
5. Timers since Go 1.23
6. Tickers, quit channels and rate limiting
7. nil channels switch cases off

## select waits on several channels

A receive waits on one channel. A **`select`** statement waits on several channel operations at
once and runs the first one that can proceed. It looks like a `switch`, but every `case` is a
send or a receive:

```go
// brew sends drink on a new channel after delay.
func brew(drink string, delay time.Duration) <-chan string {
	ch := make(chan string, 1)
	go func() {
		time.Sleep(delay)
		ch <- drink
	}()
	return ch
}

func main() {
	coffee := brew("espresso", 100*time.Millisecond)
	tea := brew("earl grey", 50*time.Millisecond)
	for range 2 {
		select {
		case c := <-coffee:
			fmt.Println("coffee:", c)
		case t := <-tea:
			fmt.Println("tea:", t)
		}
	}

	select {
	case c := <-brew("latte", time.Second):
		fmt.Println("coffee:", c)
	case <-time.After(200 * time.Millisecond):
		fmt.Println("gave up waiting for the latte")
	}
}
```

```text
tea: earl grey
coffee: espresso
gave up waiting for the latte
```

`select` blocks until at least one case can proceed. When several are ready at the same moment,
it picks one **at random**, so no channel can starve the others; never rely on the order of
cases. The last `select` is explained two sections down.

## default: operations that never block

A `default` case runs when no other case is ready, so the `select` never blocks. That gives you a
**non-blocking** send or receive:

```go
func main() {
	orders := make(chan string, 1)
	for _, order := range []string{"flat white", "mocha"} {
		select {
		case orders <- order:
			fmt.Println("queued", order)
		default:
			fmt.Println("queue full, refused", order)
		}
	}
	select {
	case order := <-orders:
		fmt.Println("making", order)
	default:
		fmt.Println("nothing to make")
	}
}
```

```text
queued flat white
queue full, refused mocha
making flat white
```

Use it to drop work when a queue is full or to check for a value without waiting. A `default`
inside a `for` loop with nothing else that blocks is a **busy loop**: it burns a CPU core polling.
If you want to wait, leave `default` out.

## Timeouts with time.After

`time.After(d)` returns a channel that receives the current time once `d` has passed. As one
case of a `select`, it puts a limit on the wait, as in the latte example: the barista needed a
second, the customer gave up after 200 ms.

`brew` makes its channel with a buffer of one. When nobody receives any more, the late goroutine
can still put its value into the buffer and finish. With an unbuffered channel it would wait to
send forever: a **goroutine leak**, one of the commonest concurrency bugs (lesson 06).

## Timers: Stop and Reset

`time.After` is enough when the wait cannot be cancelled. `time.NewTimer(d)` returns a
`*time.Timer` whose channel `C` receives once after `d`. Unlike `time.Sleep` (Medium 13), a timer
can be stopped and restarted:

```go
func main() {
	t := time.NewTimer(time.Hour)
	fmt.Println("stopped:", t.Stop())
	fmt.Println("stopped again:", t.Stop())
	fmt.Println("len and cap of C:", len(t.C), cap(t.C))

	start := time.Now()
	t.Reset(100 * time.Millisecond)
	<-t.C
	fmt.Println("fired after", time.Since(start).Round(50*time.Millisecond))
}
```

```text
stopped: true
stopped again: false
len and cap of C: 0 0
fired after 100ms
```

`Stop` reports whether it stopped a running timer. `Reset(d)` starts it again with a new
duration, which makes a timer the right tool for "give up after a quiet period": reset it every
time something happens.

## Timers since Go 1.23

Go 1.23 changed timers in two ways, for modules whose `go.mod` says 1.23 or later:

- A timer's channel is **unbuffered**, as `len` and `cap` show above. After `Stop` or `Reset`
  returns, a receive never delivers a stale value from before the call.
- A timer or ticker that the program no longer refers to is **garbage-collected**, even if it was
  never stopped. A `time.After` inside a loop no longer piles up timers.

Older code drained the channel after a failed `Stop` with `if !t.Stop() { <-t.C }`. Today that
receive can block forever: when `Stop` returns false there is nothing to drain. Go 1.23 offered
the `asynctimerchan=1` setting to bring the old behaviour back; Go 1.27 removed it, so the
channels are always unbuffered.

## Tickers, quit channels and rate limiting

A **`time.Ticker`** sends on its channel again and again, once per period, and drops ticks a slow
receiver misses. A `for` loop around a `select` with a ticker and a **quit channel** is the usual
shape of a background job:

```go
func main() {
	quit := make(chan struct{})
	go func() {
		time.Sleep(350 * time.Millisecond)
		close(quit)
	}()

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	start := time.Now()
	for {
		select {
		case <-ticker.C:
			fmt.Println("serving the next customer at", time.Since(start).Round(50*time.Millisecond))
		case <-quit:
			fmt.Println("closing time")
			return
		}
	}
}
```

```text
serving the next customer at 100ms
serving the next customer at 200ms
serving the next customer at 300ms
closing time
```

Waiting for a tick before each piece of work is **rate limiting**: here no more than ten
customers a second. `defer ticker.Stop()` ends the ticks when the loop returns; `time.Tick(d)`
returns just the channel, for a ticker you never need to stop.

## nil channels switch cases off

A receive from a nil channel is never ready, so a `select` simply never chooses its case. Set a
channel variable to `nil` once the channel is closed, and the loop stops looking at it:

```go
func main() {
	front, back := counter("Ada", "Bo"), counter("Cy")
	served := 0
	for front != nil || back != nil {
		select {
		case name, ok := <-front:
			if !ok {
				front = nil // closed: never choose this case again
				continue
			}
			fmt.Println("front counter:", name)
			served++
		case name, ok := <-back:
			if !ok {
				back = nil
				continue
			}
			fmt.Println("back counter:", name)
			served++
		}
	}
	fmt.Println("served", served)
}
```

```text
front counter: Ada
front counter: Bo
back counter: Cy
served 3
```

`counter` is a generator like lesson 02's `tickets`. The order between the two counters varies
from run to run. Without the `nil`, a closed channel is always ready, and the loop would spin
on zero values.

## Common mistakes

- **Sleeping instead of waiting.** `time.Sleep(limit)` followed by a non-blocking check always
  takes the whole limit. Put `time.After(limit)` in the `select`.
- **A timeout that leaks.** The goroutine that sends the late result blocks forever on an
  unbuffered channel. Give that channel a buffer of one.
- **Draining after Stop.** `if !t.Stop() { <-t.C }` can hang since Go 1.23. Call `Stop` or
  `Reset` and nothing more.
- **`default` in a waiting loop.** It turns the loop into a busy loop at 100% CPU. Leave it out.
- **Counting closed channels.** A closed channel stays ready, so a counter of closed channels
  reaches zero too early. Set the channel to `nil` instead.

## Practice

1. Write `tryReceive(ch <-chan int) (int, bool)` that returns at once.
2. Write `within(ch <-chan string, d time.Duration) (string, bool)` that waits at most `d`.
3. What does `t.Stop()` return for a timer of 10 ms that expired 40 ms ago without anyone
   receiving from `t.C`?

### Answers

```go
func tryReceive(ch <-chan int) (int, bool) {
	select {
	case v := <-ch:
		return v, true
	default:
		return 0, false
	}
}

func within(ch <-chan string, d time.Duration) (string, bool) {
	select {
	case v := <-ch:
		return v, true
	case <-time.After(d):
		return "", false
	}
}

func main() {
	nums := make(chan int, 1)
	fmt.Println(tryReceive(nums))
	nums <- 7
	fmt.Println(tryReceive(nums))
	fmt.Println(within(make(chan string), 50*time.Millisecond))

	t := time.NewTimer(10 * time.Millisecond)
	time.Sleep(50 * time.Millisecond)
	fmt.Println(t.Stop())
}
```

```text
0 false
7 true
 false
true
```

For 3: `true`. The value was never received, so the timer counts as still running and `Stop`
stops it.

## Key takeaways

- `select` runs one ready case, chosen at random when several are ready, and blocks otherwise.
- `default` makes it non-blocking; `time.After` gives a wait a time limit.
- Timers can be stopped and reset; since Go 1.23 their channels are unbuffered and unreferenced
  timers are collected, and Go 1.27 removed the way back.
- A ticker plus a quit channel in a `for`-`select` loop paces background work.
- A nil channel's case is never chosen: set closed channels to nil.

## Further reading

- [The Go Programming Language Specification: Select statements](https://go.dev/ref/spec#Select_statements)
- [Package time: NewTimer](https://pkg.go.dev/time#NewTimer)
- [Go 1.23 release notes](https://go.dev/doc/go1.23)
- [Go by Example: Timers](https://gobyexample.com/timers)
