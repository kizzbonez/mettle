---
title: Concurrency Patterns
summary: Combine goroutines, channels, WaitGroups and context into the standard shapes of concurrent Go (pipelines, fan-out and fan-in, worker pools, semaphores and first-error groups) that keep results in order and never leak a goroutine.
minutes: 40
objectives:
  - Build a pipeline of stages that each close their output and stop when the context is done
  - Fan work out to several goroutines and merge their outputs back into one channel
  - Run a worker pool or a semaphore that bounds parallelism and returns results in input order
  - Write a first-error group with WaitGroup, context and sync.Once, and find a goroutine leak with the goroutineleak profile
---

## Outline

1. Pipelines: stages joined by channels
2. Fan-out and fan-in
3. Worker pools and results in order
4. Bounded parallelism with a semaphore
5. Stopping at the first error
6. Goroutine leaks and the goroutineleak profile

## Pipelines: stages joined by channels

This lesson assembles goroutines, channels, `select`, `WaitGroup` and `context` into the shapes
most concurrent Go code is made of.

A **pipeline** is a chain of **stages** joined by channels. Each stage is a goroutine that
receives from an inbound channel and sends results on an outbound one. The first stage, the
**source**, has no input; the last, the **sink**, has no output. Every stage closes its outbound
channel when it has sent everything, and stops sending when the context is done, so a sink that
gives up early never leaves it blocked.

```go
// gen is the source: it sends each number, then closes its channel.
func gen(ctx context.Context, nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			select {
			case out <- n:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

// square is a stage: it receives numbers until its input closes.
func square(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			select {
			case out <- n * n:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	for n := range square(ctx, square(ctx, gen(ctx, 1, 2, 3))) {
		fmt.Println(n)
	}
}
```

```text
1
16
81
```

Stages that take and return `<-chan int` compose like functions. The deferred `cancel` stops
every stage on any early return from `main`.

## Fan-out and fan-in

**Fan-out** means several goroutines receive from one channel, sharing the work. **Fan-in**
merges several channels into one: `merge` starts a copier per input and closes the output only
when all have finished, since a send on a closed channel panics.

```go
// merge copies every input channel onto one output channel.
func merge(ctx context.Context, ins ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup
	for _, in := range ins {
		wg.Go(func() {
			for n := range in {
				select {
				case out <- n:
				case <-ctx.Done():
					return
				}
			}
		})
	}
	go func() {
		wg.Wait() // every copier has finished sending
		close(out)
	}()
	return out
}
```

In `main`, with the same `ctx`:

```go
src := gen(ctx, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
a, b, c := square(ctx, src), square(ctx, src), square(ctx, src) // fan-out
sum := 0
for n := range merge(ctx, a, b, c) { // fan-in
	sum += n
}
fmt.Println("sum of squares:", sum)
```

```text
sum of squares: 385
```

The merged order changes from run to run; the sum does not.

## Worker pools and results in order

A **worker pool** is fan-out with a fixed number of goroutines: a jobs channel carries work in, a
results channel carries answers out. To get results back in input order, send the index with
every job and let the collector put each answer in its slot:

```go
type job struct {
	index int
	text  string
}

type result struct {
	index int
	words int
}

// countWords counts the words of every text with a fixed number of workers.
func countWords(texts []string, workers int) []int {
	jobs := make(chan job)
	results := make(chan result)
	var wg sync.WaitGroup
	for range workers {
		wg.Go(func() {
			for j := range jobs {
				results <- result{j.index, len(strings.Fields(j.text))}
			}
		})
	}
	go func() {
		for i, text := range texts {
			jobs <- job{i, text}
		}
		close(jobs) // no more work: the workers' loops end
	}()
	go func() {
		wg.Wait()
		close(results) // every worker has stopped sending
	}()
	counts := make([]int, len(texts))
	for r := range results {
		counts[r.index] = r.words // the index puts it back in order
	}
	return counts
}
```

```text
[4 1 4 0]
```

That is `countWords([]string{"the quick brown fox", "jumps", "over the lazy dog", ""}, 2)`.
Workers may also write `counts[j.index]` themselves: different elements do not race, and
`wg.Wait()` makes the writes visible.

## Bounded parallelism with a semaphore

To run one goroutine per task but never more than N at once, use a buffered channel of capacity
N as a **semaphore**: send to take a token, receive to give it back. A send blocks while all N
tokens are out.

```go
sem := make(chan struct{}, 2) // two tokens: at most two at once
var mu sync.Mutex
running, peak := 0, 0
var wg sync.WaitGroup
for range 6 {
	sem <- struct{}{} // take a token; blocks while both are out
	wg.Go(func() {
		defer func() { <-sem }() // give the token back
		mu.Lock()
		running++
		peak = max(peak, running)
		mu.Unlock()
		time.Sleep(10 * time.Millisecond) // the work
		mu.Lock()
		running--
		mu.Unlock()
	})
}
wg.Wait()
fmt.Println("peak:", peak)
```

```text
peak: 2
```

Taking the token *before* `wg.Go` makes the loop wait, so no more than two workers exist at once.

## Stopping at the first error

When goroutines do parts of one task, the first failure makes the rest pointless. The standard
library has no type for this, but you can build one: a `WaitGroup` to wait, a context to cancel
the others, and a `sync.Once` to keep only the first error.

```go
// group is a small errgroup: the first error cancels the others.
type group struct {
	wg     sync.WaitGroup
	once   sync.Once
	err    error
	cancel context.CancelCauseFunc
}

func withContext(ctx context.Context) (*group, context.Context) {
	ctx, cancel := context.WithCancelCause(ctx)
	return &group{cancel: cancel}, ctx
}

func (g *group) Go(f func() error) {
	g.wg.Go(func() {
		if err := f(); err != nil {
			g.once.Do(func() {
				g.err = err
				g.cancel(err)
			})
		}
	})
}

// Wait waits for every function, then returns the first error.
func (g *group) Wait() error {
	g.wg.Wait()
	g.cancel(nil) // release the context's resources
	return g.err
}
```

Of three downloads, `mirror-2` fails at once; the other two, in a `select` on
`time.After(time.Minute)` and `ctx.Done()`, return at once instead of a minute later:

```text
first error: mirror-2: checksum mismatch
cause: mirror-2: checksum mismatch
```

Outside this sandbox, use **errgroup** (`golang.org/x/sync/errgroup`): `WithContext`, `Go`, `Wait`,
and `SetLimit(n)`, which adds a semaphore.

## Goroutine leaks and the goroutineleak profile

A **goroutine leak** is a goroutine that blocks forever; it and everything it references are
never freed. The usual cause is a send that no one will ever receive:

```go
// fastest asks every mirror and returns the first to answer.
func fastest(delays map[string]time.Duration) string {
	answers := make(chan string)
	for name, delay := range delays {
		go func() {
			time.Sleep(delay)
			answers <- name // blocks forever for all but the first
		}()
	}
	return <-answers
}
```

Go 1.27 made the **goroutineleak profile** generally available. The garbage collector finds
goroutines blocked on a channel, mutex or condition that no running goroutine can reach, so they
can never wake. After `fastest` with mirrors answering in 10, 30 and 50 ms, and a 100 ms pause,
`pprof.Lookup("goroutineleak").WriteTo(os.Stdout, 1)` prints:

```text
fastest: eu
goroutineleak profile: total 2
2 @ 0x4b40ca 0x44c03c 0x44bc37 0x560da9 0x4ba201
#	0x560da8	main.fastest.func1+0x68	/work/main.go:16
```

Two goroutines are stuck on line 16, the send. `net/http/pprof` serves the same profile at
`/debug/pprof/goroutineleak`. It misses a leak on a channel still reachable from a global
variable, but it names the common ones by line.

## Common mistakes

- **Closing a shared output in each producer.** A `defer close(out)` in every `merge` copier closes
  it when the first input ends; the next send fails with `panic: send on closed channel`. Close it
  once, after `wg.Wait()`.
- **Forgetting to close the jobs channel.** The workers' `range jobs` never ends, `wg.Wait()` never
  returns: `fatal error: all goroutines are asleep - deadlock!`.
- **A send without an exit.** `out <- v` blocks forever once the consumer stops reading. Put every
  send in a `select` with `<-ctx.Done()`, or give the channel room for every value.

## Practice

1. Fix the leak in `fastest` by changing one line, and confirm it with the profile.
2. What does `countWords(texts, 0)` return, and what does it leave behind? Guard against it.
3. Why does `merge` call `wg.Wait()` and `close(out)` in a goroutine of their own, and not just
   before `return out`?

### Answers

```go
answers := make(chan string, len(delays))  // 1: room for every answer
workers = max(1, min(workers, len(texts))) // 2: first line of countWords
```

```text
fastest: eu
goroutineleak profile: total 0
```

With no workers, `wg.Wait()` returns at once and `countWords` returns `[0 0 0 0]`, but the
feeder stays blocked on `jobs <- job{i, text}`: the profile reports `total 1` there.

In `merge`, the copiers finish only when someone receives from `out`: the caller, which has not
got `out` yet. Waiting before `return` would deadlock.

## Key takeaways

- A stage closes its own output and selects on `ctx.Done()` around every send.
- Fan-in closes the merged channel once, after every copier has finished.
- An index carried with each job restores input order; a buffered channel bounds parallelism.
- First error: a `WaitGroup`, a cancellable context and a `sync.Once`.
- Every goroutine needs a way to finish; the goroutineleak profile finds those that cannot.

## Further reading

- [The Go Blog: Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines)
- [Go 1.27 release notes: goroutine leak profile](https://go.dev/doc/go1.27)
- [Package errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)
- [Go by Example: Worker Pools](https://gobyexample.com/worker-pools)
