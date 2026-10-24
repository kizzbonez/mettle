---
title: Profiling and Performance
summary: Make Go code faster by measuring first. Write benchmarks with b.Loop and -benchmem, compare runs with benchstat, count allocations, read CPU and memory profiles with pprof, see escape analysis, cut allocations, and tune the garbage collector with GOGC, GOMEMLIMIT and PGO.
minutes: 40
objectives:
  - Write a benchmark with b.Loop, run it with -benchmem and read ns/op, B/op and allocs/op
  - Collect a CPU or memory profile and find the hot spot with go tool pprof
  - Read -gcflags=-m output and remove needless allocations by preallocating and building in place
  - Explain what GOGC, GOMEMLIMIT, the Green Tea collector and PGO change
---

## Outline

1. Measure first
2. Benchmarks with b.Loop and -benchmem
3. Finding the hot spot with pprof
4. Counting allocations in a test
5. Escape analysis
6. Reducing allocations
7. The garbage collector, GOGC, GOMEMLIMIT and PGO

## Measure first

Intuition about speed is wrong surprisingly often. The time goes somewhere you did not expect,
or the "slow" code runs once a day. Work in a loop instead: write a **benchmark** that measures
the operation, **profile** it to see where the time or memory goes, change one thing, and
measure again. Keep the change only if the numbers say so, and keep the benchmark so that a
later change cannot quietly undo it.

## Benchmarks with b.Loop and -benchmem

A market office prints a list of its 500 stalls. Three ways to build it:

```go
func joinPlus(names []string) string { // += copies the whole string each time
	s := ""
	for i, n := range names {
		if i > 0 {
			s += ", "
		}
		s += n
	}
	return s
}

// joinBuilder is the same loop writing to a strings.Builder; joinGrow first adds
// up the lengths and calls b.Grow(size), so the buffer is allocated once.
```

A benchmark lives in a `_test.go` file next to the code (Medium 10):

```go
func BenchmarkJoinPlus(b *testing.B) {
	for b.Loop() {
		joinPlus(names)
	}
}
```

`b.Loop` (Go 1.24) runs the body as many times as it needs for a stable result, keeps the
results alive so the compiler cannot delete the call, and leaves set-up code above the loop out
of the timing. `-benchmem` adds memory columns:

```sh
go test -bench . -benchmem
```

```text
BenchmarkJoinPlus-2      	     636	   2048343 ns/op	 2942730 B/op	     998 allocs/op
BenchmarkJoinBuilder-2   	   51793	     23012 ns/op	   24816 B/op	      13 allocs/op
BenchmarkJoinGrow-2      	  179226	      7398 ns/op	    6144 B/op	       1 allocs/op
```

The `-2` is GOMAXPROCS. The columns are the iterations run, time per operation, bytes
allocated per operation and allocations per operation. `+=` is quadratic: each step copies
everything built so far, so 500 names cost 998 allocations and almost 3 MB. The builder grows
its buffer as it fills, in 13 allocations. `joinGrow` allocates exactly once and is over 270
times faster than `joinPlus`.

Numbers from one run are noisy. To compare a change, run each version with `-count 10` into a
file and give both files to **benchstat** (`golang.org/x/perf/cmd/benchstat`, a tool you add
with `go get -tool`, lesson 01). It prints the change with a confidence interval, or `~` when
the difference is noise. Never benchmark with `-race`: it slows code down many times, unevenly.

## Finding the hot spot with pprof

A **profile** samples a running program. A CPU profile records which functions are on the
stack many times a second; a memory profile records where allocations happen. `go test`
writes both (`-benchtime 300x` runs exactly 300 iterations):

```sh
go test -run '^$' -bench JoinPlus -benchtime 300x -cpuprofile cpu.out -memprofile mem.out
go tool pprof -top -nodecount=4 -sample_index=alloc_space mem.out
```

```text
      flat  flat%   sum%        cum   cum%
  826.61MB 99.66% 99.66%   826.61MB 99.66%  example.com/report.joinPlus (inline)
         0     0% 99.66%   826.61MB 99.66%  example.com/report.BenchmarkJoinPlus
```

That is the start of the table. **Flat** is what the function did itself, **cum** includes
everything it called. The CPU profile of the same run shows `runtime.memmove`, the copying, at
the top with 30% of the samples. `go tool pprof -http=localhost:8080 cpu.out` opens a web UI, which shows a **flame
graph** by default since Go 1.26: each bar is a function, as wide as its share of the samples.

Outside tests, `runtime/pprof` writes profiles from a program (`pprof.StartCPUProfile(f)`, then
`defer pprof.StopCPUProfile()`). A service imports `net/http/pprof`, which registers handlers
under `/debug/pprof/` on `http.DefaultServeMux`. Serve that mux on a private address only,
such as `http.ListenAndServe("localhost:6060", nil)` in its own goroutine, never on the public
port: profiles reveal your code and cost CPU.

## Counting allocations in a test

`testing.AllocsPerRun(runs, f)` returns the average number of allocations of one call:

```go
for _, n := range []int{10, 1000, 100000} {
	grow := testing.AllocsPerRun(20, func() { sink = idsGrow(n) })
	pre := testing.AllocsPerRun(20, func() { sink = idsPrealloc(n) })
	fmt.Printf("n=%-6d append from nil: %2.0f allocs   preallocated: %.0f\n", n, grow, pre)
}
```

`idsGrow` appends to a nil slice; `idsPrealloc` starts with `make([]int, 0, n)`. Run with
`go run .`, then with `go run -race .`:

```text
n=10     append from nil:  2 allocs   preallocated: 1
n=1000   append from nil:  9 allocs   preallocated: 1
n=100000 append from nil: 25 allocs   preallocated: 1
```

```text
n=10     append from nil:  5 allocs   preallocated: 1
n=1000   append from nil: 12 allocs   preallocated: 1
n=100000 append from nil: 28 allocs   preallocated: 1
```

The exact counts change with the race detector and between Go versions, but the shape does
not: one version grows with `n`, the other stays at one. A test that pins the shape, such as
"at most one allocation for any size", is a regression test that does not depend on timing.

## Escape analysis

The compiler decides where each value lives. A value that cannot outlive its function stays on
the **stack**, which is free to clean up; one that might is **moved to the heap**, where the
garbage collector must find and free it. This is **escape analysis**, and `-gcflags=-m` prints
its decisions (`-l` turns off inlining to keep the report short):

```go
func newReading(stall string, cents int) *reading {
	r := reading{stall, cents}
	return &r
}
```

```sh
go build -gcflags='-m -l' .
```

```text
./main.go:10:17: leaking param: stall
./main.go:11:2: moved to heap: r
./main.go:15:12: rs does not escape
./main.go:25:20: []reading{...} does not escape
./main.go:27:13: ... argument does not escape
./main.go:27:14: sum escapes to heap
```

`r` is returned by address, so it moves to the heap. A slice literal that `total` only reads
stays on the stack. Passing `sum` to `fmt.Println` boxes the int in an interface, which here
allocates. None of this is wrong; it tells you where a hot loop's allocations come from.

## Reducing allocations

- **Preallocate** slices and maps when you know the size: `make([]T, 0, n)`,
  `make(map[K]V, n)`.
- **Build text in one buffer**: `strings.Builder` with `Grow`, `strings.Join`, or append-style
  functions like `strconv.AppendInt(dst, n, 10)` that write into a slice you reuse.
- **Avoid needless conversions**: `strconv.Itoa(n)` does less work than `fmt.Sprintf("%d", n)`
  (both allocate the result), and `strconv.AppendInt(buf[:0], int64(n), 10)` into a reused
  buffer allocates nothing. Converting `[]byte` to `string` and back usually copies.
- **`sync.Pool`** reuses temporary objects such as buffers across calls. Reset what you take
  out, expect it to be emptied at any garbage collection, and use it only where a profile shows
  the allocations matter.

## The garbage collector, GOGC, GOMEMLIMIT and PGO

Go's collector runs alongside your code. **GOGC** (default 100) starts a cycle when new
allocations reach that percentage of the live heap the last cycle left: doubling it roughly
halves GC CPU and doubles the memory overhead. **GOMEMLIMIT** sets a soft limit on the runtime's total memory; in a
container with 512 MiB, `GOMEMLIMIT=460MiB` leaves headroom and makes the collector work harder
before the limit is reached. Since Go 1.26 the **Green Tea** collector is the default; the
release notes expect 10 to 40% less GC overhead in programs that collect heavily. Go 1.27 made
many small allocations (under 80 bytes) up to 30% cheaper. Fewer allocations still help most.

**Profile-guided optimisation (PGO)** feeds a CPU profile from production back to the
compiler: save it as `default.pgo` in the main package's directory and `go build` uses it
(`-pgo=auto` is the default). The Go team reports gains of about 2 to 14%.

## Common mistakes

- **Optimising without measuring.** Rewrite only what a profile shows is hot.
- **Trusting one run.** Use `-count` and benchstat; a 3% change in one run is usually noise.
- **Benchmarking under `-race`** or with a laptop on battery: both distort the numbers.
- **Exposing `/debug/pprof`.** A blank import of `net/http/pprof` adds it to `DefaultServeMux`;
  if your public server uses that mux, anyone can profile it. Use your own mux for the API.

## Practice

1. `joinGrow` sized its buffer by hand. Which standard function does that for you? Benchmark it.
2. Write a test that fails if `labels` (one `"stall "+code` string per code, in a slice made
   with `make([]string, 0, len(codes))`) allocates more than once per code plus once for the
   slice.
3. A service runs in a container with a 1 GiB memory limit. What would you set?

### Answers

```go
func joinStd(names []string) string { return strings.Join(names, ", ") }

func TestLabelsAllocations(t *testing.T) {
	codes := []string{"A1", "A2", "B7"}
	allocs := testing.AllocsPerRun(100, func() { labels(codes) })
	if allocs > 4 {
		t.Errorf("labels of 3 codes: %.0f allocations, want at most 4", allocs)
	}
}
```

```text
BenchmarkJoinStd-2   	  186516	      6466 ns/op	    6144 B/op	       1 allocs/op
--- PASS: TestLabelsAllocations (0.02s)
```

`strings.Join` adds up the lengths and allocates once, like `joinGrow`. For question 3:
`GOMEMLIMIT=900MiB` or so, about 10% below the limit, and leave GOGC at its default.

## Key takeaways

- Benchmark with `b.Loop` and `-benchmem`, compare with `-count` and benchstat, never under `-race`.
- `go test -cpuprofile` / `-memprofile` and `go tool pprof` show where time and memory go.
- `testing.AllocsPerRun` pins the allocation shape in a test.
- `-gcflags=-m` explains heap allocations; preallocate, size builders, append in place.
- GOGC trades memory for GC CPU; GOMEMLIMIT is a soft cap; PGO uses `default.pgo`.

## Further reading

- [Go diagnostics](https://go.dev/doc/diagnostics)
- [A guide to the Go garbage collector](https://go.dev/doc/gc-guide)
- [Profile-guided optimization](https://go.dev/doc/pgo)
- [Package testing: benchmarks](https://pkg.go.dev/testing#hdr-Benchmarks)
