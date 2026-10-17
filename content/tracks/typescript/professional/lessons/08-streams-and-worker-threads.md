---
title: Streams and Worker Threads
summary: Process data piece by piece with Node streams and pipeline, respect backpressure so memory stays flat, move CPU-heavy work to worker threads so the event loop stays responsive, and carry request context through async code with AsyncLocalStorage.
minutes: 35
objectives:
  - Build a stream pipeline with async generator transforms and pipeline from node:stream/promises
  - Explain backpressure and react to write() returning false by waiting for drain
  - Run CPU-bound work in a worker thread and explain why it keeps the server responsive
  - Use AsyncLocalStorage to make a request id available to all code a request runs
---

## Outline

1. Why streams
2. Pipelines with async generators
3. Backpressure
4. Worker threads for CPU-bound work
5. Request context with `AsyncLocalStorage`

## Why streams

`readFile` loads a whole file into memory before you see a byte. For a 4 GB log or an upload that arrives over a minute, that means 4 GB of memory and a minute of waiting. A **stream** delivers data in **chunks** as it becomes available, so a program can process a file of any size in a small, constant amount of memory and start producing output at once.

Node has four kinds: **Readable** streams produce data (`fs.createReadStream`, an HTTP request body), **Writable** streams consume it (`fs.createWriteStream`, an HTTP response), and **Duplex** and **Transform** streams do both, a Transform turning its input into output (compression, parsing). A Readable is also an **async iterable**, so `for await (const chunk of stream)` reads it, as lesson 6 did with request bodies.

## Pipelines with async generators

`pipeline` from `node:stream/promises` connects a source, any number of transforms and a destination, and returns a promise that settles when the data has all flowed or something failed. A transform can be an **async generator function**: it receives the previous stage as an async iterable and `yield`s its output. This program turns a CSV file of meter readings into JSON lines, skipping the header and bad rows:

```ts
import { createReadStream, createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";

await writeFile("meters.csv", "meter,kwh\nM-1,12.5\nM-2,oops\nM-3,40\nM-4,7.25\n");

async function* lines(source: AsyncIterable<Buffer>): AsyncGenerator<string> {
  let rest = "";
  for await (const chunk of source) {
    const parts = (rest + chunk.toString("utf8")).split("\n");
    rest = parts.pop() ?? "";
    yield* parts;
  }
  if (rest !== "") yield rest;
}

async function* toJsonLines(source: AsyncIterable<string>): AsyncGenerator<string> {
  for await (const line of source) {
    const [meter, kwh] = line.split(",");
    const value = Number(kwh);
    if (meter === "meter" || Number.isNaN(value)) continue;
    yield JSON.stringify({ meter, kwh: value }) + "\n";
  }
}

await pipeline(createReadStream("meters.csv"), lines, toJsonLines, createWriteStream("meters.jsonl"));
console.log(await readFile("meters.jsonl", "utf8"));
```

```text
{"meter":"M-1","kwh":12.5}
{"meter":"M-3","kwh":40}
{"meter":"M-4","kwh":7.25}
```

`lines` must keep the `rest`: a chunk ends wherever the file system cut it, often in the middle of a line, so the last piece waits for the next chunk. The types document each stage: `Buffer` chunks in, `string` lines through, `string` output to the file.

Prefer `pipeline` to the older `source.pipe(destination)`. If any stage fails, `pipeline` destroys every stream in the chain, closing file handles, and rejects with the error. `.pipe()` does neither, which leaks descriptors and hides failures.

## Backpressure

A fast source feeding a slow destination would pile data up in memory. **Backpressure** is how streams prevent it. Each Writable has a buffer whose size is its **`highWaterMark`**: 64 KiB for byte streams in Node.js 26, and 16 objects in object mode. `write()` returns `false` once the buffer reaches that mark, which means "stop until I emit `drain`". Here a deliberately slow sink takes three readings at a time:

```ts
import { once } from "node:events";
import { Writable } from "node:stream";
import { setTimeout as sleep } from "node:timers/promises";

const slowSink = new Writable({
  objectMode: true,
  highWaterMark: 3,
  write(reading: number, _encoding, done) {
    sleep(5).then(() => done(), done);
  },
});

let waits = 0;
for (let reading = 1; reading <= 10; reading++) {
  const accepted = slowSink.write(reading);
  console.log(`wrote ${reading}, buffered ${slowSink.writableLength}, accepted ${accepted}`);
  if (!accepted) {
    waits += 1;
    await once(slowSink, "drain");
  }
}
slowSink.end();
await once(slowSink, "finish");
console.log(`waited for drain ${waits} times`);
```

```text
wrote 1, buffered 1, accepted true
wrote 2, buffered 2, accepted true
wrote 3, buffered 3, accepted false
wrote 4, buffered 1, accepted true
wrote 5, buffered 2, accepted true
wrote 6, buffered 3, accepted false
wrote 7, buffered 1, accepted true
wrote 8, buffered 2, accepted true
wrote 9, buffered 3, accepted false
wrote 10, buffered 1, accepted true
waited for drain 3 times
```

The buffer never holds more than three readings, however many the loop has. Ignoring the `false` would still work, but every reading would wait in memory; with a million rows, that is how a service runs out of memory. `pipeline` and `for await` handle backpressure for you, which is one more reason to use them.

## Worker threads for CPU-bound work

Node runs your JavaScript on **one thread** around the event loop. Waiting for I/O costs that thread nothing, but a long calculation occupies it, and every other request waits. **Worker threads** run JavaScript in parallel: each `Worker` has its own V8 instance, memory and event loop, and talks to the main thread by **messages**, values copied with the structured clone algorithm. The worker file:

```ts
import { parentPort, workerData } from "node:worker_threads";
import { countPrimes } from "./primes.js";

parentPort?.postMessage(countPrimes(workerData as number));
```

The main program counts primes below five million twice, once on the main thread and once in a worker, while a timer tries to tick every 10 ms:

```ts
async function countPrimesInWorker(limit: number): Promise<number> {
  const worker = new Worker(new URL("./prime-worker.js", import.meta.url), { workerData: limit });
  const [result] = (await once(worker, "message")) as [number];
  return result;
}
```

```text
main thread: 348513 primes, 0 ticks in 1309 ms
worker:      348513 primes, 140 ticks in 1423 ms
```

On the main thread the timer never ran: for 1.3 seconds the process could not answer anything. With the worker, the timer ticked 140 times, so a server would have kept serving. `workerData` and messages are `any` on arrival, so cast or validate them as you would JSON. `once` rejects if the worker emits `error`, so a crash in the worker becomes a rejected promise. Starting a worker costs milliseconds, so long-running services keep a **pool** of workers instead of one per task. Use workers for CPU-bound work only; they do not make I/O faster.

## Request context with `AsyncLocalStorage`

A log line is far more useful with the id of the request that caused it, but passing `requestId` through every function is tedious. **`AsyncLocalStorage`** from `node:async_hooks` stores a value that follows the asynchronous flow: everything started inside `run(store, callback)`, including code after an `await`, sees that store through `getStore()`:

```ts
import { AsyncLocalStorage } from "node:async_hooks";
import { setTimeout as sleep } from "node:timers/promises";

const context = new AsyncLocalStorage<{ requestId: string }>();

function log(message: string): void {
  const requestId = context.getStore()?.requestId ?? "-";
  console.log(`[${requestId}] ${message}`);
}

async function loadAccount(name: string, delayMs: number): Promise<void> {
  log(`loading ${name}`);
  await sleep(delayMs);
  log(`loaded ${name}`);
}

async function handle(requestId: string, name: string, delayMs: number): Promise<void> {
  await context.run({ requestId }, () => loadAccount(name, delayMs));
}

await Promise.all([handle("req-1", "ana", 30), handle("req-2", "bo", 10)]);
log("all done");
```

```text
[req-1] loading ana
[req-2] loading bo
[req-2] loaded bo
[req-1] loaded ana
[-] all done
```

The two requests interleave, yet each log line carries the right id, and code outside any `run` gets `undefined`. The type parameter makes `getStore()` return `{ requestId: string } | undefined`, so the compiler insists you handle the case outside a request.

## Common mistakes

- **`readFile` on unbounded input.** Stream it.
- **Ignoring `write()`'s return value** in a loop, which buffers everything. Await `drain`, or use `pipeline`.
- **`.pipe()` without error handling**, which leaves streams open when one fails. Use `pipeline`.
- **A worker per request.** Startup cost dominates small tasks; use a pool, and only for CPU-bound work.

## Practice

1. Add a transform to the pipeline that keeps only readings above 10 kWh.
2. In the backpressure example, what is printed with `highWaterMark: 5`?
3. A route resizes images and makes every other request slow. What do you change?

### Answers

1. Insert `async function* (source: AsyncIterable<string>) { for await (const line of source) if ((JSON.parse(line) as { kwh: number }).kwh > 10) yield line; }` after `toJsonLines`. It keeps M-1 and M-3.
2. `accepted` is `false` at readings 5 and 10, and `waited for drain 2 times`.
3. Resizing is CPU-bound and blocks the event loop. Run it in worker threads, ideally a fixed pool, and await the result.

## Key takeaways

- Streams process data in chunks with flat memory; `pipeline` connects them, cleans up and reports errors.
- Async generator functions make typed transforms.
- `write()` returning `false` means wait for `drain`; the default `highWaterMark` is 64 KiB, or 16 objects.
- Worker threads keep CPU-bound work off the event loop; messages are copied and arrive untyped.
- `AsyncLocalStorage` carries request context through `await` without extra parameters.

## Further reading

- [Node.js 26: Stream](https://nodejs.org/docs/latest-v26.x/api/stream.html)
- [Node.js: Backpressuring in streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams)
- [Node.js 26: Worker threads](https://nodejs.org/docs/latest-v26.x/api/worker_threads.html)
- [Node.js 26: Asynchronous context tracking](https://nodejs.org/docs/latest-v26.x/api/async_context.html)
