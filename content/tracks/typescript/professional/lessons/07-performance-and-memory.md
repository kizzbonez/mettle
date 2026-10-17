---
title: Performance and Memory
summary: Measure before optimizing with performance.now and the CPU profiler, understand how V8's hidden classes reward objects of one shape, watch heap usage, and find and fix a memory leak with heap snapshots.
minutes: 35
objectives:
  - Time code fairly with performance.now, including warm-up, and find hot functions with --cpu-prof
  - Explain hidden classes and inline caches, and write objects that keep one shape
  - Read process.memoryUsage and recognize the pattern of a memory leak
  - Find what holds memory with heap snapshots and fix an unbounded cache
---

## Outline

1. Measure first
2. Finding hot code with the CPU profiler
3. Hidden classes and monomorphic code
4. Memory and the garbage collector
5. A memory leak and its fix
6. Heap snapshots

## Measure first

Performance work starts with a measurement, because intuition about what is slow is usually wrong. `performance.now()` returns a high-resolution time in milliseconds, so the difference between two calls times the code between them.

Node.js runs JavaScript with **V8**, the engine from Chrome. V8 first interprets a function, then compiles the functions that run often into optimized machine code, a **just-in-time** (JIT) compiler. A fair measurement therefore runs the code once before timing it, so the timed run measures the optimized version. Here two ways to remove duplicate order ids are compared:

```ts
function uniqueWithArray(ids: readonly string[]): string[] {
  const seen: string[] = [];
  for (const id of ids) {
    if (!seen.includes(id)) seen.push(id);
  }
  return seen;
}

function uniqueWithSet(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

function time(label: string, run: () => string[]): void {
  run();
  const start = performance.now();
  const result = run();
  const elapsed = performance.now() - start;
  console.log(`${label}: ${result.length} ids in ${elapsed.toFixed(1)} ms`);
}

const ids = Array.from({ length: 40_000 }, (_, i) => `order-${i % 25_000}`);
time("array", () => uniqueWithArray(ids));
time("set", () => uniqueWithSet(ids));
```

```text
array: 25000 ids in 1198.5 ms
set: 25000 ids in 2.8 ms
```

A second run printed 972.3 ms and 2.7 ms: timings vary, so repeat them and compare orders of magnitude, not decimals. The difference is an algorithm, not a micro-optimization. `includes` scans the whole array for every id, so the work grows with the square of the input, while a `Set` lookup takes about the same time however large the set is. The biggest wins come from doing less work.

## Finding hot code with the CPU profiler

In a real program you do not know which function to time. A **CPU profiler** samples the running program many times a second and records which function was executing. Node writes a profile with `--cpu-prof`:

```console
$ node --cpu-prof --cpu-prof-dir=profiles dist/main.js
array: 25000 ids in 1366.7 ms
set: 25000 ids in 4.6 ms
$ ls profiles
CPU.20261017.113524.24.0.001.cpuprofile
```

Load the `.cpuprofile` file into the Performance panel of Chrome DevTools, or open it in VS Code, and sort by **self time**, the time spent in the function itself. In this run, 97.8% of the samples were inside `uniqueWithArray`. With source maps on, the profile names your TypeScript functions. For a server, `node --inspect` lets DevTools attach and record while you send it traffic.

## Hidden classes and monomorphic code

JavaScript objects can gain and lose properties at any time, which would make every property read a dictionary lookup. V8 avoids that with **hidden classes** (V8 calls them maps): objects that got the same properties in the same order share one hidden class, which records where each property is stored. Code that reads `point.x` keeps an **inline cache** of the hidden classes it has seen there. With one hidden class, the read is **monomorphic** and compiles to a single memory access. A few classes make it **polymorphic**, and beyond four it becomes **megamorphic**, falling back to a slow generic lookup.

TypeScript's structural typing hides this: every object below is a `Point` to the compiler, but V8 sees six different shapes. Two functions with identical bodies are timed, one fed objects of one shape, the other of six:

```ts
interface Point {
  x: number;
  y: number;
}

function totalXSameShapes(points: readonly Point[]): number {
  let total = 0;
  for (const point of points) total += point.x;
  return total;
}

const makers: ((i: number) => Point)[] = [
  (i) => ({ x: i, y: 1 }),
  (i) => ({ y: 1, x: i }),
  (i) => ({ x: i, y: 1, z: 0 }),
  (i) => ({ id: i, x: i, y: 1 }),
  (i) => ({ label: "p", x: i, y: 1 }),
  (i) => ({ x: i, label: "p", y: 1 }),
];
const same = Array.from({ length: 10_000 }, (_, i) => ({ x: i, y: 1 }));
const mixed = same.map((point, i) => makers[i % makers.length]?.(i) ?? point);
```

```text
same shape : 20 ms for 2000 passes
six shapes : 194 ms for 2000 passes
```

(`totalXMixedShapes` is a copy of the first function, and the timing loop warms each up for 200 passes first.) About ten times slower, for code that looks identical. The habits that keep shapes stable are simple: create objects of one kind in one place (a class constructor or a factory function), assign every field there in the same order, give optional fields an explicit `undefined` instead of adding them later, and never `delete` a property. This matters in the hot loops a profile points at, not everywhere.

## Memory and the garbage collector

The **garbage collector** reclaims objects that nothing reachable refers to any more. So a **memory leak** in TypeScript is a reference you keep without meaning to: a cache that only grows, a listener never removed, a timer never cleared, a closure holding a large object.

`process.memoryUsage()` reports, among others, `heapUsed` (bytes of live JavaScript objects) and `rss` (all memory the process holds). A leak shows as `heapUsed` that keeps climbing under steady load, even right after a collection. When the heap reaches its limit (set with `--max-old-space-size`), the process crashes with "JavaScript heap out of memory".

## A memory leak and its fix

A price service caches quotes (objects with `requestId`, `route` and `cents`) by request id. Request ids never repeat, so the cache never hits and never shrinks. The second version keeps at most 1,000 entries, deleting the oldest, which is the first key of the `Map` because a `Map` remembers insertion order:

```ts
function makeQuoter(cache: Map<string, Quote>, limit: number) {
  return (requestId: string): Quote => {
    const cached = cache.get(requestId);
    if (cached) return cached;
    const quote = { requestId, route: `route-${requestId.length}`, cents: requestId.length * 10 };
    cache.set(requestId, quote);
    if (cache.size > limit) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    return quote;
  };
}

function heapMb(): string {
  globalThis.gc?.();
  return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
}
```

Three rounds of 200,000 requests each, with `limit` set to `Infinity` and then to 1,000, run with `node --expose-gc dist/main.js` so that `gc()` can force a collection before each reading:

```text
unbounded: 30.6 MB, 57.5 MB, 91.3 MB (cache holds 600000)
bounded: 4.3 MB, 3.5 MB, 3.5 MB (cache holds 1000)
```

The unbounded heap grows by about 30 MB a round, forever; the bounded one stays flat. Every cache needs a limit, an expiry, or both. When the cached data belongs to an object, a `WeakMap` keyed by that object lets the entry be collected together with it.

## Heap snapshots

In a real service, the question is *what* is growing. A **heap snapshot** records every object on the heap and what refers to it. Start the service so that a signal writes one:

```console
$ node --heapsnapshot-signal=SIGUSR2 dist/server.js &
$ kill -USR2 $!
$ ls *.heapsnapshot
Heap.20261017.113605.12.0.001.heapsnapshot
```

`writeHeapSnapshot()` from `node:v8` does the same from code. The Node.js guide's method: exercise the suspect feature briefly, take a snapshot, keep exercising it, take a second one, load both into the Memory tab of Chrome DevTools, and choose **Comparison**. Object types with large positive growth are the leak, and the panel below shows the chain of references keeping them alive, which leads back to the code that holds them. A snapshot blocks the process while it is written and needs up to twice the heap's memory, so never expose the trigger publicly.

## Common mistakes

- **Timing a single cold run.** The first call includes compilation. Warm up, repeat, compare medians.
- **Optimizing without a profile.** Rewriting code that takes 1% of the time changes nothing.
- **Adding properties after construction** (`if (vip) order.discount = 5;`), which gives objects of one type several shapes. Declare `discount: number | undefined` and always assign it.
- **Caches without bounds**, the most common leak in services. Limit size or age.

## Practice

1. Why does `time` call `run()` once before starting the clock?
2. A class sets `this.label` only in some branches of its constructor. What would you change, and why?
3. `heapUsed` goes up and down between 40 and 60 MB under steady load for hours. Is that a leak?

### Answers

1. The first call runs interpreted and triggers compilation; timing it measures the JIT, not the code you care about.
2. Assign `this.label` in every branch, to `undefined` when there is none, so all instances share one hidden class and property reads stay monomorphic.
3. No. Memory rising between collections and falling after them is normal. A leak is a floor that keeps rising.

## Key takeaways

- Measure with `performance.now()` after a warm-up, and profile with `--cpu-prof` before changing code; algorithms beat micro-optimizations.
- V8's hidden classes make property reads fast when objects of one kind share one shape; TypeScript types do not guarantee that.
- A leak in JavaScript is an unintended reference; a cache that only grows is the classic case.
- Heap snapshots compared in DevTools show which objects grow and who holds them.

## Further reading

- [Node.js 26: Performance measurement APIs](https://nodejs.org/docs/latest-v26.x/api/perf_hooks.html)
- [Node.js: Using heap snapshots](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot)
- [V8 blog: Fast properties in V8](https://v8.dev/blog/fast-properties)
- [MDN: Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)
