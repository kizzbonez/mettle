---
title: The Event Loop and Async Patterns
summary: Predict the order in which synchronous code, microtasks and macrotasks run, limit how many tasks run at once, cancel work with AbortController, AbortSignal.timeout and AbortSignal.any, create promises with Promise.withResolvers, and consume async iterators with for await.
minutes: 40
objectives:
  - Predict the output order of synchronous code, `process.nextTick`, promise reactions and `setImmediate`
  - Explain what `await` gives up and why two async functions interleave
  - Run a list of async tasks with a concurrency limit
  - Make an async function cancellable with an `AbortSignal`, and combine signals with `AbortSignal.any`
  - Write and consume an async generator with `for await`, and use `Promise.withResolvers`
---

## Outline

1. One thread and a queue of work
2. Microtasks and macrotasks
3. What `await` gives up
4. Limiting concurrency
5. Cancelling with `AbortController`
6. Async iterators and `Promise.withResolvers`

## One thread and a queue of work

Your JavaScript runs on one thread. A function call runs to its end before anything else happens.
When the current code finishes and the call stack is empty, the **event loop** picks the next piece
of waiting work: a timer that is due, a file that has been read, a network packet. Async code never
interrupts running code; it is queued and runs later. Every example in this lesson is
deterministic because it uses ordering, not time: `setImmediate`, resolved promises and
`queueMicrotask`. Code that relies on one timer firing before another is fragile.

## Microtasks and macrotasks

There are two kinds of queued work. A **macrotask** (or task) is a callback the loop runs in one of
its phases: timers, I/O callbacks, `setImmediate` (Node's "check" phase). A **microtask** is a
promise reaction (the code after `then` or `await`) or a `queueMicrotask` callback. After each
macrotask, and after the main script, the whole microtask queue is drained before the loop moves
on. Node.js also has `process.nextTick`, whose queue the Node.js documentation says "is always
processed before the microtask queue":

```ts
console.log("A: synchronous code runs first");
setImmediate(() => console.log("F: setImmediate, a macrotask"));
Promise.resolve().then(() => console.log("C: promise reaction, a microtask"));
queueMicrotask(() => console.log("D: queueMicrotask"));
process.nextTick(() => console.log("E: process.nextTick"));
console.log("B: still synchronous");
```

```text
A: synchronous code runs first
B: still synchronous
E: process.nextTick
C: promise reaction, a microtask
D: queueMicrotask
F: setImmediate, a macrotask
```

Microtasks run in the order they were queued, and all of them run before `setImmediate`. A
microtask that keeps queueing microtasks therefore starves the loop: timers and I/O wait until the
chain ends. Only `setTimeout` and `setImmediate` in the main module have no guaranteed order
relative to each other, so this example uses only `setImmediate`.

## What `await` gives up

`await` pauses the async function and returns control to its caller. The rest of the function
runs later, as a microtask, when the awaited promise settles. Even `await null` gives other
microtasks a turn:

```ts
async function worker(name: string, steps: number): Promise<void> {
  for (let step = 1; step <= steps; step++) {
    console.log(`${name} step ${step}`);
    await null;
  }
}

setImmediate(() => console.log("immediate"));
await Promise.all([worker("left", 3), worker("right", 2)]);
console.log("both done");
```

```text
left step 1
right step 1
left step 2
right step 2
left step 3
both done
immediate
```

The two workers take turns at each `await`, all within microtasks, so the `setImmediate`
callback runs only after everything else. The top-level `await` works because the file is an ES
module.

## Limiting concurrency

`Promise.all(items.map(task))` starts every task at once. With a thousand files or requests that
can exhaust memory or a server's patience. A **worker pool** starts a few workers that each take
the next item until none are left:

```ts
const nextTurn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

async function mapLimit<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function runWorker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

let running = 0;
let peak = 0;
const sizes = await mapLimit(["a.txt", "bb.txt", "ccc.txt", "dddd.txt", "e.txt"], 2, async (file) => {
  running++;
  peak = Math.max(peak, running);
  await nextTurn();
  running--;
  return file.length;
});
console.log(sizes, `at most ${peak} at once`);
```

```text
[ 5, 6, 7, 8, 5 ] at most 2 at once
```

`const index = next++` is safe without locks: it runs synchronously, so no other worker can run
between reading and incrementing `next`. Results go to their item's index, so the order is kept.
If a task rejects, `Promise.all` rejects, but the other worker keeps going until the list is empty.

## Cancelling with `AbortController`

An **`AbortController`** cancels work. Its `signal`, an **`AbortSignal`**, is passed to the work;
`controller.abort(reason)` marks the signal aborted, stores the reason and fires its `abort`
event. Node's own APIs (`fetch`, `fs/promises`, `timers/promises`, streams) accept a `signal`.
Your functions do the same by checking it. `signal.throwIfAborted()` throws `signal.reason` if
the signal is aborted:

```ts
const nextTurn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

async function importRows(rows: readonly string[], signal: AbortSignal): Promise<number> {
  let imported = 0;
  for (const row of rows) {
    signal.throwIfAborted();
    await nextTurn();
    imported++;
    console.log(`imported ${row}`);
  }
  return imported;
}

const controller = new AbortController();
const job = importRows(["r1", "r2", "r3", "r4"], controller.signal);
await nextTurn();
controller.abort(new Error("user pressed cancel"));
try {
  await job;
} catch (error) {
  console.log("stopped:", (error as Error).message);
}

const user = new AbortController();
const combined = AbortSignal.any([user.signal, AbortSignal.timeout(60_000)]);
combined.addEventListener("abort", () => console.log("combined:", combined.reason), { once: true });
user.abort("closed the tab");
console.log("aborted:", combined.aborted);
```

```text
imported r1
imported r2
stopped: user pressed cancel
combined: closed the tab
aborted: true
```

Cancellation is **cooperative**: `r2` was already under way when the abort came, and the function
noticed at its next check. `abort()` without a reason uses a `DOMException` named `AbortError`.
`AbortSignal.timeout(ms)` returns a signal that aborts with a `TimeoutError` after a delay (its
timer alone does not keep a Node.js process running), and
`AbortSignal.any([...])` one that aborts when any of its inputs does, with that input's reason.
Here the user cancelled first, so the combined signal aborted at once with `"closed the tab"`.
Use timeouts as limits in real programs, never as the way tests decide what happens.

## Async iterators and `Promise.withResolvers`

An **async generator** (`async function*`) can `await` and `yield`; it returns an
**async iterator**, which `for await` consumes one value at a time. Leaving the loop early with
`break` calls the iterator's `return`, so the generator's `finally` block runs:

```ts
const nextTurn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

async function* pages(total: number, signal?: AbortSignal): AsyncGenerator<string[], void, undefined> {
  try {
    for (let page = 1; page <= total; page++) {
      signal?.throwIfAborted();
      await nextTurn();
      yield [`item ${page}a`, `item ${page}b`];
    }
  } finally {
    console.log("generator cleaned up");
  }
}

for await (const items of pages(5)) {
  console.log(items.join(", "));
  if (items[0] === "item 2a") break;
}

const { promise, resolve } = Promise.withResolvers<string>();
setImmediate(() => resolve("ready"));
console.log(await promise);
```

```text
item 1a, item 1b
item 2a, item 2b
generator cleaned up
ready
```

`AsyncGenerator<string[], void, undefined>` names what it yields, returns and accepts from `next`.
Pages are produced only when the loop asks for them, so pages 3 to 5 are never fetched.
**`Promise.withResolvers()`** (ES2024) returns a promise together with its `resolve` and `reject`
functions, which helps when the code that settles a promise is not where it is created, such as
an event handler.

## Common mistakes

- **Using timers to decide order in tests.** Two `setTimeout` calls with close delays may fire in
  either order on a busy machine. Use resolved promises, `setImmediate` or explicit signals.
- **`Promise.all` on an unbounded list** of heavy tasks. Limit concurrency.
- **Accepting a signal and never checking it.** Check before each step, and pass the signal on to
  the APIs you call.
- **Leaving `abort` listeners attached** after the work finishes; remove them or use `{ once: true }`.

## Practice

1. Write `waitTurns(turns, signal?)`, which waits that many `setImmediate` turns and rejects with
   the signal's reason once it is aborted.
2. Write an async generator `take(source, count)` that yields the first `count` values of any
   async iterable and stops pulling from it afterwards.

### Answers

```ts
async function waitTurns(turns: number, signal?: AbortSignal): Promise<void> {
  for (let turn = 0; turn < turns; turn++) {
    signal?.throwIfAborted();
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  signal?.throwIfAborted();
}

async function* take<T>(source: AsyncIterable<T>, count: number): AsyncGenerator<T> {
  if (count <= 0) return;
  let taken = 0;
  for await (const item of source) {
    yield item;
    taken++;
    if (taken >= count) return;
  }
}

async function* counter(): AsyncGenerator<number> {
  for (let n = 1; ; n++) {
    await waitTurns(1);
    console.log(`produced ${n}`);
    yield n;
  }
}

const controller = new AbortController();
const waiting = waitTurns(100, controller.signal);
controller.abort(new Error("cancelled"));
await waiting.catch((error: Error) => console.log(error.message));
for await (const n of take(counter(), 2)) console.log(`got ${n}`);
```

```text
cancelled
produced 1
got 1
produced 2
got 2
```

`take` returns right after the last wanted value, so `counter` never produces a third.

## Key takeaways

- Code runs to completion; then microtasks drain, then the loop takes the next macrotask.
- `await` resumes in a microtask, so async functions interleave at each `await`.
- A worker pool limits how many tasks run at once.
- `AbortSignal` carries cancellation; `throwIfAborted`, `timeout` and `any` build on it.
- `for await` pulls from async iterators; `break` runs the generator's `finally`.

## Further reading

- [Node.js: The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Node.js 26: Globals, AbortController and queueMicrotask](https://nodejs.org/docs/latest-v26.x/api/globals.html)
- [MDN: AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)
- [MDN: for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
