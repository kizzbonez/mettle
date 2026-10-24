---
title: Mutexes, Atomics and the Race Detector
summary: Find data races with the race detector and fix them with a mutex kept inside the struct it guards, a read-write mutex, sync.Once and OnceValue, typed atomics or sync.Map, and choose between a mutex and a channel.
minutes: 40
objectives:
  - Define a data race, run code with -race and read the report it prints
  - Protect a struct's fields with a sync.Mutex or sync.RWMutex inside the struct, using Lock and defer Unlock
  - Use sync.OnceValue for lazy set-up and atomic.Int64, atomic.Bool and atomic.Pointer for single values
  - Explain why a struct holding a mutex must not be copied, and when a mutex beats a channel
---

## Outline

1. What a data race is
2. The race detector
3. sync.Mutex
4. sync.RWMutex
5. sync.Once and OnceValue
6. Atomic values
7. sync.Map
8. Never copy a mutex
9. Mutex or channel?

## What a data race is

Lesson 01 ended with four goroutines losing passengers from one counter. The Go memory model
defines the problem: a **data race** is a write to a memory location at the same time as another
read or write of it, unless all the accesses are atomic. "At the same time" means that nothing
orders the two accesses: no channel operation, lock or `Wait` between them. Programs with races do
not just give wrong totals. A racing read of a string, slice, map or interface can see half of one
write and half of another, which can corrupt memory. The memory model's advice is short: "Don't be
clever." Synchronize every shared access.

## The race detector

Add `-race` to `go run`, `go test` or `go build`, and the program records every memory access and
reports any two that are not ordered. A test of a departures board that one goroutine updates
while another reads it, with no lock, fails under `go test -race .`:

```text
WARNING: DATA RACE
Write at 0x00c00007e6f0 by goroutine 9:
  runtime.mapassign_faststr()
      /usr/local/go/src/internal/runtime/maps/runtime_faststr.go:261 +0x0
  example/board.(*Board).Set()
      /work/board.go:13 +0x50
  example/board.TestBoard.func1()
      /work/board_test.go:11 +0x12

Previous read at 0x00c00007e6f0 by goroutine 10:
  runtime.mapaccess2_faststr()
...
--- FAIL: TestBoard (0.00s)
    testing.go:1867: race detected during execution of test
FAIL
```

Read it from the top: what happened (a write, inside a map assignment), where in your code
(`board.go:13`, in `Set`), and the access it conflicts with. Skip the `runtime` lines and look for
your own files. The detector only sees races that happen during the run, so tests must exercise
the concurrent paths. It costs roughly 5 to 10 times the memory and 2 to 20 times the time, so it
belongs in tests and CI, not production. Every lab in this course runs under it: a race fails a
test even when every value is right.

## sync.Mutex

A **mutex** (mutual exclusion lock) lets one goroutine at a time into a **critical section**.
`Lock` waits until the mutex is free and takes it; `Unlock` releases it. Put the mutex inside the
struct, next to the fields it guards, and lock it in every method that touches them:

```go
// turnstile counts passengers. It is safe for use by many goroutines.
type turnstile struct {
	mu    sync.Mutex // guards count
	count int
}

func (t *turnstile) pass() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.count++
}

func (t *turnstile) total() int {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.count
}

func main() {
	var gate turnstile
	var wg sync.WaitGroup
	for range 4 {
		wg.Go(func() {
			for range 10_000 {
				gate.pass()
			}
		})
	}
	wg.Wait()
	fmt.Println("passengers:", gate.total())
}
```

```text
passengers: 40000
```

`defer t.mu.Unlock()` unlocks on every return path, and even after a panic. The zero `Mutex` is
unlocked and ready, so `var gate turnstile` needs no constructor. Note that `total` locks too:
reads race with writes just as writes do.

## sync.RWMutex

When a value is read far more often than it is changed, a **`sync.RWMutex`** lets any number of
readers in together (`RLock` and `RUnlock`) while a writer (`Lock`) waits for them and then has it
alone:

```go
// prices is read by every till and changed only when the manager updates it.
type prices struct {
	mu    sync.RWMutex
	cents map[string]int
}

func (p *prices) lookup(item string) (int, bool) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	c, ok := p.cents[item]
	return c, ok
}

func (p *prices) set(item string, c int) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.cents[item] = c
}
```

Calling `p.lookup("scone")` after `p.set("scone", 320)` prints `320 true`. Start with a plain
`Mutex`; switch when many goroutines read at once and measurements show them waiting for each
other.

## sync.Once and OnceValue

Some set-up should happen once, on first use, however many goroutines ask at the same moment.
`sync.Once` runs a function exactly once (`once.Do(f)`), and Go 1.21's **`sync.OnceValue(f)`**
wraps a function returning a value: the first call runs `f`, callers that arrive meanwhile wait,
and everyone gets the same result:

```go
var menu = sync.OnceValue(func() []string {
	fmt.Println("loading the menu")
	return []string{"soup", "pie", "crumble"}
})

func main() {
	var wg sync.WaitGroup
	for table := range 3 {
		wg.Go(func() {
			fmt.Println("table", table, "sees", len(menu()), "dishes")
		})
	}
	wg.Wait()
}
```

```text
loading the menu
table 2 sees 3 dishes
table 1 sees 3 dishes
table 0 sees 3 dishes
```

`sync.OnceFunc(f)` does the same for a function without a result, and `sync.OnceValues` for one
returning a value and an error.

## Atomic values

For a single number, flag or pointer, the typed values in **`sync/atomic`** do the job without a
lock: `atomic.Int64` (and `Int32`, `Uint64`...) with `Add`, `Load`, `Store`, `Swap` and
`CompareAndSwap`; `atomic.Bool`; and `atomic.Pointer[T]`, which swaps a whole value, such as a
configuration, in one step. Their zero values are ready to use:

```go
type config struct {
	openFrom, openUntil string
}

func main() {
	var visitors atomic.Int64
	var current atomic.Pointer[config]
	current.Store(&config{openFrom: "09:00", openUntil: "17:00"})

	var wg sync.WaitGroup
	for range 50 {
		wg.Go(func() {
			visitors.Add(1)
		})
	}
	wg.Go(func() {
		current.Store(&config{openFrom: "09:00", openUntil: "20:00"}) // late opening
	})
	wg.Wait()

	fmt.Println("visitors:", visitors.Load())
	fmt.Println("open until:", current.Load().openUntil)
}
```

```text
visitors: 50
open until: 20:00
```

Atomics protect one value. Two fields that must change together, such as a map and its counter,
need a mutex.

## sync.Map

`sync.Map` is a map safe for concurrent use without a lock of your own, but untyped (`any` keys and
values). The documentation says most code should use a plain map with a mutex. It pays in two
cases: entries written once and read many times, such as a cache that only grows, or goroutines
that work on separate sets of keys.

## Never copy a mutex

A copied mutex is a different lock, so a method with a **value receiver** locks its own copy and
protects nothing. `func (t turnstile) total() int` compiles, but `go vet` reports it:

```text
main.go:13:9: total passes lock by value: example.turnstile contains sync.Mutex
```

The same goes for `WaitGroup`, `Once` and the atomic types. Give types that hold one pointer
receivers, and pass them around by pointer.

## Mutex or channel?

The Go wiki's rule of thumb: channels for passing ownership of data, handing out work and
delivering results; mutexes for caches and state. Use whichever makes the code simplest. When a
mutex's locking rules grow complicated, a goroutine that owns the state and talks over channels
may be clearer.

## Common mistakes

- **Locking only the writes.** A read without the lock races with a write; the report says `Read
  at ... Previous write at`. Lock in every method that touches the fields.
- **Returning without `Unlock`.** The next `Lock` waits forever. Write `defer mu.Unlock()` on the
  line after `Lock`.
- **Slow work under a lock.** Every other goroutine waits for it. Copy what you need, unlock,
  then do the slow part.
- **Check-then-act with atomics.** `if !claimed.Load() { claimed.Store(true) }` lets two goroutines
  both see `false`. Use `claimed.CompareAndSwap(false, true)`.

## Practice

1. Write a `scoreboard` with a map of team points, safe for many goroutines, with `add` and
   `score` methods.
2. Count the goals with an `atomic.Int64` instead.
3. Three runners race for one trophy. Award it exactly once with an `atomic.Bool`.

### Answers

```go
// scoreboard keeps each team's points. It is safe for use by many goroutines.
type scoreboard struct {
	mu     sync.Mutex
	points map[string]int
}

func (s *scoreboard) add(team string, n int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.points[team] += n
}

func (s *scoreboard) score(team string) int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.points[team]
}

func main() {
	s := &scoreboard{points: map[string]int{}}
	var goals atomic.Int64
	var wg sync.WaitGroup
	for range 100 {
		wg.Go(func() {
			s.add("rovers", 1)
			goals.Add(1)
		})
	}
	wg.Wait()
	fmt.Println(s.score("rovers"), goals.Load())

	var claimed atomic.Bool
	for runner := range 3 {
		wg.Go(func() {
			if claimed.CompareAndSwap(false, true) {
				fmt.Println("runner", runner, "takes the trophy")
			}
		})
	}
	wg.Wait()
}
```

```text
100 100
runner 0 takes the trophy
```

Any runner may win, but only one line is ever printed.

## Key takeaways

- A data race is an unordered pair of accesses, one a write. Find races with `-race`; the labs
  always use it.
- Keep a `sync.Mutex` beside the fields it guards; `Lock`, then `defer Unlock`, in every method.
- `RWMutex` lets readers share; `OnceValue` runs set-up exactly once.
- Typed atomics guard one value; `CompareAndSwap` makes check-then-act safe.
- Never copy a struct holding a lock: pointer receivers.

## Further reading

- [The Go Memory Model](https://go.dev/ref/mem)
- [Data Race Detector](https://go.dev/doc/articles/race_detector)
- [Package sync](https://pkg.go.dev/sync)
- [Go wiki: Use a sync.Mutex or a channel?](https://go.dev/wiki/MutexOrChannel)
