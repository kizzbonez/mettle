---
title: Goroutines and WaitGroups
summary: Run functions concurrently with the go statement, wait for them with sync.WaitGroup and its Go method, collect their results safely by index, and recognise your first data race.
minutes: 35
objectives:
  - Explain the difference between concurrency and parallelism, and what GOMAXPROCS controls
  - Start goroutines with go and wait for them with sync.WaitGroup (Add, Done, Wait and Go)
  - Collect the results of many goroutines in a pre-sized slice, one index per goroutine
  - Recognise a data race and read the race detector's report
---

## Outline

1. Concurrency and parallelism
2. The go statement
3. Waiting with sync.WaitGroup
4. WaitGroup.Go and results by index
5. Loop variables belong to one iteration
6. GOMAXPROCS and counting goroutines
7. A first data race

## Concurrency and parallelism

Every program so far did one thing at a time, yet real programs spend much of their time
waiting: for a disk, a network reply, a slow device. **Concurrency** means structuring a program
as several tasks that make progress independently, so that while one waits, another runs.
**Parallelism** means executing several things at the same instant on several CPU cores. A
well-built concurrent program is correct on one core and faster on many. Go gives you the
structure; the runtime decides what runs in parallel.

## The go statement

A **goroutine** is a function call running concurrently with the rest of the program. Write `go`
before a call to start one:

```go
package main

import "fmt"

func announce(stop string) {
	fmt.Println("next stop:", stop)
}

func main() {
	go announce("Harbour Street")
	fmt.Println("doors closing")
}
```

Built and run without the race detector, it usually prints only:

```text
doors closing
```

The go statement evaluates the arguments, starts the goroutine and moves on without waiting;
any results the function returns are thrown away. Then `main` returns, and **when main returns,
the program ends**, goroutines and all. One run in three printed the announcement too: pure luck.
(Under `go run -race`, the race detector pauses for a second before exiting, which usually lets
the goroutine finish. That is not a fix.)

Goroutines are cheap: each starts with a small stack that grows as needed, and the runtime
spreads them over a few operating-system threads, so a program can run hundreds of thousands.
The race detector makes each one far more expensive; keep lab workloads to hundreds.

## Waiting with sync.WaitGroup

Sleeping in `main` for "long enough" is a guess that fails on a busy machine. To wait, use a
**`sync.WaitGroup`**, a counter of unfinished tasks:

```go
func main() {
	stops := []string{"Harbour Street", "Mill Lane", "Station Road"}
	var wg sync.WaitGroup
	for _, stop := range stops {
		wg.Add(1)
		go func() {
			defer wg.Done()
			announce(stop)
		}()
	}
	wg.Wait()
	fmt.Println("all stops announced")
}
```

```text
next stop: Mill Lane
next stop: Harbour Street
next stop: Station Road
all stops announced
```

`Add(1)` raises the counter, `Done` lowers it (deferred, so it runs however the function ends),
and `Wait` blocks until the counter is zero. The order of the three lines changes from run to
run: goroutines run in no fixed order, so never rely on one.

Call `Add` before the go statement, in the goroutine that will `Wait`. If the new goroutine
called `Add` itself, `Wait` could run first, see zero and return early. `go vet` reports it:

```text
main.go:12:10: WaitGroup.Add called from inside new goroutine
```

## WaitGroup.Go and results by index

Go 1.25 added **`wg.Go(f)`**: it adds one to the counter, runs `f` in a new goroutine and calls
`Done` when `f` returns. The documentation tells callers to prefer it, so this course uses it
from here on. The function passed to it must not panic.

To get results back, make the result slice first, with one element per task, and let each
goroutine write only its own element:

```go
// inspect pretends to check one tram, which takes a while.
func inspect(tram int) string {
	time.Sleep(100 * time.Millisecond)
	return fmt.Sprintf("tram %d ok", tram)
}

func main() {
	trams := []int{12, 7, 31, 4, 19}
	reports := make([]string, len(trams))
	start := time.Now()

	var wg sync.WaitGroup
	for i, tram := range trams {
		wg.Go(func() {
			reports[i] = inspect(tram)
		})
	}
	wg.Wait()

	fmt.Println(reports)
	fmt.Println("took about", time.Since(start).Round(100*time.Millisecond))
}
```

```text
[tram 12 ok tram 7 ok tram 31 ok tram 4 ok tram 19 ok]
took about 100ms
```

Five inspections of 100 ms took 100 ms in all. Different elements of a slice are different
variables, so no two goroutines touch the same memory, and the return of each `f` is guaranteed
to happen before `Wait` returns, so `main` sees every write. The reports stay in input order,
whatever order the goroutines finish in.

## Loop variables belong to one iteration

Each closure above uses its own `i` and `tram`: since Go 1.22, every iteration of a `for` loop
has fresh copies of the loop's variables. Before, all iterations shared one. With `go 1.21` in
`go.mod`, the stops example printed:

```text
Station Road
Station Road
Station Road
```

and `go vet` warned `main.go:14:16: loop variable stop captured by func literal`. Older code
works around it with `stop := stop` inside the loop; in a module at Go 1.22 or later you can
delete such lines.

## GOMAXPROCS and counting goroutines

**GOMAXPROCS** is the number of CPUs that can execute Go code at the same time.
`runtime.GOMAXPROCS(0)` reads it without changing it, and `runtime.NumGoroutine()` counts the
goroutines that exist, `main` included:

```go
func main() {
	fmt.Println("CPUs:", runtime.NumCPU(), "GOMAXPROCS:", runtime.GOMAXPROCS(0))
	fmt.Println("goroutines:", runtime.NumGoroutine())
	release := make(chan struct{})
	var wg sync.WaitGroup
	for range 3 {
		wg.Go(func() {
			<-release // wait until main closes release (next lesson)
		})
	}
	fmt.Println("goroutines:", runtime.NumGoroutine())
	close(release)
	wg.Wait()
}
```

```text
CPUs: 12 GOMAXPROCS: 2
goroutines: 1
goroutines: 4
```

The machine has 12 CPUs, but the sandbox container may use only one. Since Go 1.25 the default
on Linux respects a container's CPU limit (it never goes below 2 unless the machine has fewer
CPUs), and the runtime updates it when the limit changes.

## A first data race

Four goroutines each count 100,000 passengers onto one counter:

```go
func main() {
	passengers := 0
	var wg sync.WaitGroup
	for range 4 {
		wg.Go(func() {
			for range 100_000 {
				passengers++
			}
		})
	}
	wg.Wait()
	fmt.Println("passengers:", passengers)
}
```

Three runs without the race detector:

```text
passengers: 266709
passengers: 400000
passengers: 349714
```

`passengers++` reads the counter, adds one and writes it back. When two goroutines read the same
old value, both write old + 1 and one passenger is lost. This is a **data race**: two goroutines
use the same variable at the same time, at least one of them writing, with nothing ordering the
accesses. `go run -race` reports it, with the line (14 is `passengers++`) and the goroutines:

```text
WARNING: DATA RACE
Read at 0x00c000018108 by goroutine 9:
  main.main.func1()
      /work/main.go:14 +0x37

Previous write at 0x00c000018108 by goroutine 8:
  main.main.func1()
      /work/main.go:14 +0x49
...
Found 2 data race(s)
exit status 66
```

Every lab in this course runs under the race detector, so a racy solution fails even when its
numbers come out right. Lesson 04 fixes shared counters with mutexes and atomics; until then,
give each goroutine its own variable, as the index pattern does.

## Common mistakes

- **Not waiting.** Returning from `main` or from a function before its goroutines finish loses
  their work. Wait with a `WaitGroup`; never `time.Sleep` and hope.
- **`Add` inside the goroutine.** `Wait` may return too early; vet says `WaitGroup.Add called
  from inside new goroutine`. Use `wg.Go`.
- **Copying a WaitGroup.** `func inspect(tram int, wg sync.WaitGroup)` calls `Done` on a copy,
  so `Wait` never returns. Vet: `inspect passes lock by value: sync.WaitGroup contains
  sync.noCopy`. Pass `*sync.WaitGroup`, or keep it out of the signature with `wg.Go`.
- **More `Add` than `Done`.** `Wait` blocks forever. Without `-race` the runtime stops with
  `fatal error: all goroutines are asleep - deadlock!` and `goroutine 1 [sync.WaitGroup.Wait]:`;
  under `-race` the same program simply hangs.
- **Appending from goroutines.** `results = append(results, x)` in each goroutine races on the
  slice and scrambles the order. Pre-size the slice and write by index.

## Practice

1. Write `lengths(words []string) []int` that measures each word in its own goroutine and keeps
   the order.
2. Rewrite the stops example with `wg.Go`.
3. What does `go vet` say about `wg.Add(1)` written as the first line inside `go func() { ... }()`,
   and why is it a bug?

### Answers

```go
func lengths(words []string) []int {
	result := make([]int, len(words))
	var wg sync.WaitGroup
	for i, word := range words {
		wg.Go(func() {
			result[i] = len(word)
		})
	}
	wg.Wait()
	return result
}

func main() {
	fmt.Println(lengths([]string{"tram", "depot", "pantograph"}))
	fmt.Println(lengths(nil))

	var wg sync.WaitGroup
	for _, stop := range []string{"Harbour Street", "Mill Lane", "Station Road"} {
		wg.Go(func() {
			fmt.Println("next stop:", stop)
		})
	}
	wg.Wait()
	fmt.Println("all stops announced")
}
```

```text
[4 5 10]
[]
next stop: Harbour Street
next stop: Mill Lane
next stop: Station Road
all stops announced
```

The stops may come in any order. For 3, vet reports `WaitGroup.Add called from inside new
goroutine`: `Wait` can find the counter at zero and return while the work is still going.

## Key takeaways

- `go f(x)` starts `f` concurrently and does not wait; when `main` returns, the program ends.
- A `WaitGroup` counts unfinished tasks; prefer `wg.Go(f)` to `Add` and `Done`.
- Pre-size a result slice and let each goroutine write its own index.
- Loop variables are per iteration since Go 1.22.
- GOMAXPROCS caps how many goroutines execute at once and respects container CPU limits.
- Unsynchronized access to one variable, with a write, is a data race. Run with `-race`.

## Further reading

- [The Go Programming Language Specification: Go statements](https://go.dev/ref/spec#Go_statements)
- [Package sync: WaitGroup](https://pkg.go.dev/sync#WaitGroup)
- [Go 1.25 release notes](https://go.dev/doc/go1.25)
- [Data Race Detector](https://go.dev/doc/articles/race_detector)
