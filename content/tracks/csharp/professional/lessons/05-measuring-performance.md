---
title: Measuring Performance
summary: Measure before you optimise, know why a bare Stopwatch misleads, benchmark with BenchmarkDotNet, count allocations in a test, and find hot spots with the .NET diagnostic tools.
minutes: 25
objectives:
  - List the effects that make a single Stopwatch timing wrong, and write a timing loop that avoids the worst of them
  - Describe how BenchmarkDotNet is set up and read its Mean, Error, StdDev and Allocated columns
  - Count allocations with `GC.GetAllocatedBytesForCurrentThread` and turn the count into a regression test
  - Choose between dotnet-counters, dotnet-trace and a memory dump for a given production symptom
---

## Outline

1. Measure first
2. Why a bare `Stopwatch` misleads
3. BenchmarkDotNet
4. Counting allocations
5. Profiling a running process

## Measure first

Intuition about speed is wrong often enough that every optimisation should start and end with a
measurement. The loop is always the same: observe a symptom, **profile** to find where the time
or memory goes, form a hypothesis, change one thing, and measure again against the old version
(the **baseline**). A **benchmark** runs a piece of code many times under controlled conditions
and reports a time with its spread; a **profiler** watches a whole running program and says
which code is hot. You need both: the profiler tells you what to benchmark.

## Why a bare `Stopwatch` misleads

`Stopwatch` itself is precise. What goes wrong is what it measures:

- **Debug builds.** `dotnet build` defaults to the Debug configuration, which turns optimisation
  off. Measure Release builds (`-c Release`, or `-optimize+` for `csc`).
- **JIT and tiered compilation.** The first call to a method includes compiling it. With
  **tiered compilation**, on by default since .NET Core 3.0, a method first gets quick,
  unoptimised code (tier 0) and is recompiled with full optimisation (tier 1) in the background
  once it has been called enough; **dynamic PGO** then uses what tier 0 observed. Early
  iterations therefore run different machine code from later ones.
- **Dead code.** If the result is never used, the JIT may remove the work.
- **Noise.** Garbage collections, other processes, CPU frequency changes and timer resolution
  all land in some samples and not others. One sample is an anecdote.

A hand-made loop can avoid the worst of this: warm up, keep the result, take many samples and
report the median, which is less sensitive to outliers than the mean:

```csharp
using System.Diagnostics;

int[] data = Enumerable.Range(1, 10_000).ToArray();
var samples = new double[1_001];
long checksum = 0;
for (int i = 0; i < samples.Length; i++)
{
    long start = Stopwatch.GetTimestamp();
    checksum += SumOfSquares(data);           // keep the result so the work cannot be removed
    samples[i] = Stopwatch.GetElapsedTime(start).TotalMicroseconds;
}

double[] rest = samples[1..].Order().ToArray();
double median = rest[rest.Length / 2];
Console.WriteLine($"checksum {checksum}");
Console.WriteLine($"first call slower than the median of the rest: {samples[0] > median}");
Console.Error.WriteLine($"first {samples[0]:F1} us, median {median:F1} us");

static long SumOfSquares(int[] values)
{
    long sum = 0;
    foreach (int v in values) sum += (long)v * v;
    return sum;
}
```

```text
checksum 333716718335000
first call slower than the median of the rest: True
```

The times go to standard error because they change on every run and every machine. In this
course's sandbox, over seven runs, the first call took between 40 and 70 times the median. A
loop like this is fine for a first look, but it does not compare two versions fairly.

## BenchmarkDotNet

**BenchmarkDotNet** is the standard .NET benchmarking library. It builds your benchmarks in
Release in a separate process, runs warm-up iterations until the timings settle, runs many
measured iterations, and reports statistics. It needs the `BenchmarkDotNet` NuGet package, so
this adaptation of its getting-started example does not run in the sandbox:

```csharp
// dotnet add package BenchmarkDotNet, then: dotnet run -c Release
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

BenchmarkRunner.Run<CsvBenchmarks>();

[MemoryDiagnoser]                          // adds Gen0 and Allocated columns
public class CsvBenchmarks
{
    private readonly int[] _ids = Enumerable.Range(0, 1_000).ToArray();

    [Benchmark(Baseline = true)]
    public string Join() => string.Join(",", _ids);

    [Benchmark]
    public string Builder()
    {
        var sb = new System.Text.StringBuilder();
        foreach (int id in _ids) sb.Append(id).Append(',');
        return sb.ToString();              // return the result: unused results can be optimised away
    }
}
```

It prints a table per benchmark: **Mean** (average time per call), **Error** (half the width of
the confidence interval), **StdDev** (spread of the measurements), **Ratio** against the
baseline, **Gen0** (gen 0 collections per 1,000 calls) and **Allocated** (bytes per call).
Its documented good practices: Release build, no debugger attached, return results, a quiet
machine, and never assume a result carries over to another runtime, OS or processor.

## Counting allocations

Time varies; allocation counts mostly do not. For a given input, the bytes a method allocates on
one thread are usually the same on every run, so you can assert on them in an ordinary test and
catch a regression the day someone adds a LINQ call to a hot loop:

```csharp
static (long Bytes, int Gen0) Measure(Action work)
{
    work();                                       // warm up
    int gen0 = GC.CollectionCount(0);
    long before = GC.GetAllocatedBytesForCurrentThread();
    work();
    return (GC.GetAllocatedBytesForCurrentThread() - before, GC.CollectionCount(0) - gen0);
}

string result = "";
var concat = Measure(() =>
{
    string csv = "";
    for (int i = 0; i < 1_000; i++) csv += i + ",";
    result = csv;
});
var builder = Measure(() =>
{
    var sb = new StringBuilder(capacity: 4_000);
    for (int i = 0; i < 1_000; i++) sb.Append(i).Append(',');
    result = sb.ToString();
});
Console.WriteLine($"+= in a loop : {concat.Bytes,9:N0} B, gen0 collections {concat.Gen0}");
Console.WriteLine($"StringBuilder: {builder.Bytes,9:N0} B, gen0 collections {builder.Gen0}");
```

```text
+= in a loop : 3,844,104 B, gen0 collections 0
StringBuilder:    15,880 B, gen0 collections 0
```

Each `+=` copies the whole string so far, so the garbage grows with the square of the length.
No collection happened during this one call because the generation 0 budget here is larger
than 3.8 MB; in a service doing it on every request, those bytes become collections. The
counter covers only the current thread, so measure work that runs on it, not inside `Task.Run`.

## Profiling a running process

When the slow thing is a whole service, use the .NET diagnostic tools, installed with
`dotnet tool install --global <name>` (with the .NET 10 SDK, `dnx <name>` runs one without
installing it):

```bash
dotnet-counters ps                                  # list .NET processes
dotnet-counters monitor -p 4242 --counters System.Runtime
dotnet-trace collect -p 4242 --duration 00:00:00:30 # sampled stacks plus runtime events
dotnet-trace collect -p 4242 --format Speedscope    # a file https://www.speedscope.app can open
dotnet-gcdump collect -p 4242                       # what is on the managed heap
```

- **dotnet-counters** shows live numbers: CPU, GC heap size, collections per generation,
  allocation totals, thread pool queue length, lock contentions. Use it first to find which
  kind of problem you have.
- **dotnet-trace** records a trace (by default sampled thread stacks plus lightweight runtime
  events) into a `.nettrace` file for Visual Studio or PerfView, or Speedscope format. Its
  usual picture is a **flame graph**, in which width is the share of samples: optimise what is
  wide.
- **dotnet-gcdump** and **dotnet-dump** capture the heap or the whole process, for memory leaks
  and deadlocks. A gcdump forces a full collection, which can pause a service with a big heap.

Visual Studio's profiler and PerfView offer the same data with more analysis.

## Common mistakes

- Timing a Debug build, or the first call only.
- Benchmarks whose result is discarded, or that measure the setup.
- Optimising code the profiler never showed as hot.
- Comparing numbers taken on different machines or runtimes.
- Reading the allocation counter around code that runs on another thread.

## Practice

1. A colleague times `Parse()` once with `Stopwatch` in a Debug build and reports 2 ms. List
   three reasons the number is not trustworthy.
2. Write a test assertion that fails if `FormatInvoiceLine(invoice)` starts allocating more than
   one string per call.
3. A service's memory grows for hours until it is restarted. Which tool do you reach for first,
   and which next?

### Answers

1. Debug code is unoptimised; the first call includes JIT compilation and runs tier 0 code; a
   single sample includes whatever else happened (a GC, another process); and nothing proves
   the result was used.
2. Warm up once, then read the counter before and after one call:
   `long before = GC.GetAllocatedBytesForCurrentThread(); string line = FormatInvoiceLine(invoice); long used = GC.GetAllocatedBytesForCurrentThread() - before;`.
   Measure `new string('x', line.Length)` the same way and assert that `used` is no larger.
   A fixed budget measured once and written into the test works too.
3. `dotnet-counters monitor` to confirm that the GC heap, not native memory, is growing and in
   which generation; then `dotnet-gcdump collect` twice, some time apart, and compare which
   types grew.

## Key takeaways

- Profile to find the hot spot, benchmark to compare fixes, and measure again afterwards.
- A single `Stopwatch` reading mixes in JIT, tiering, noise and Debug code.
- BenchmarkDotNet handles warm-up, statistics and allocation columns; run it in Release.
- Allocation counts are stable enough to assert on in tests.
- dotnet-counters first, then dotnet-trace or a dump.

## Further reading

- [.NET diagnostics tools overview](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/)
- [dotnet-trace](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-trace)
- [BenchmarkDotNet: getting started](https://benchmarkdotnet.org/articles/guides/getting-started.html)
- [BenchmarkDotNet: good practices](https://benchmarkdotnet.org/articles/guides/good-practices.html)
