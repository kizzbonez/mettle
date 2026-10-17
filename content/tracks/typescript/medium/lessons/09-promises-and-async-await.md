---
title: Promises and async/await
summary: Understand why JavaScript code waits with callbacks and promises instead of blocking, create and consume typed promises, write `async` functions with `await` and `try`/`catch`, let the compiler catch a forgotten `await`, run work concurrently with `Promise.all`, `allSettled`, `race` and `any`, and use top-level `await` in modules.
minutes: 35
objectives:
  - Explain callbacks and the three states of a promise, and create a `Promise<T>`
  - Write `async` functions with explicit `Promise<T>` return types and handle rejections with `try`/`catch`
  - Recognize the compiler errors a forgotten `await` produces
  - Choose between `Promise.all`, `allSettled`, `race` and `any`
---

## Outline

1. Waiting without blocking
2. Callbacks
3. Promises
4. `async` and `await`
5. Errors, and the forgotten `await`
6. Running work concurrently
7. Top-level `await`

## Waiting without blocking

Reading a file, querying a database or calling a web service takes time, often thousands of times
longer than running a line of code. JavaScript runs your code on a single thread, so it never
stops to wait: it starts the slow operation, carries on, and runs a piece of your code later, when
the result is ready. Code that works this way is **asynchronous**. There are three styles of
writing it, and modern code uses the last.

## Callbacks

The oldest style passes a function, a **callback**, that is called with the result. Many Node.js
APIs use an *error-first* callback: the first argument is an error or `null`.

```ts
function readStationCallback(id: string, done: (error: Error | null, celsius?: number) => void): void {
  setTimeout(() => {
    if (id.startsWith("ST")) {
      done(null, id.length * 3.5);
    } else {
      done(new Error(`unknown station ${id}`));
    }
  }, 20);
}

readStationCallback("ST-N", (error, north) => {
  if (error) {
    console.log(error.message);
    return;
  }
  readStationCallback("ST-SOUTH", (error2, south) => {
    if (error2) {
      console.log(error2.message);
      return;
    }
    console.log(`north ${north}, south ${south}`);
  });
});
console.log("waiting for readings");
```

```text
waiting for readings
north 14, south 28
```

`setTimeout(fn, ms)` runs `fn` later, standing in for a slow device. The last line printed first,
because the callbacks run after the main code finishes. Each further step nests deeper, and every
level must handle its own error. That shape is why promises were invented.

## Promises

A **promise** is an object that stands for a result that is not ready yet. It is **pending** at
first and later **settles** once: **fulfilled** with a value, or **rejected** with an error. Its
TypeScript type names the value: `Promise<number>`. You create one with `new Promise`, passing a
function that receives `resolve` and `reject`; you consume it with `then` (on success), `catch` (on
failure) and `finally` (either way).

```ts
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readStation(id: string): Promise<number> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id.startsWith("ST")) {
        resolve(id.length * 3.5);
      } else {
        reject(new Error(`unknown station ${id}`));
      }
    }, 20);
  });
}

console.log("1. asking");
readStation("ST-04")
  .then((celsius) => console.log(`3. ST-04 reads ${celsius} C`))
  .catch((error: unknown) => console.log("never printed", error))
  .finally(() => console.log("4. done"));
readStation("XX-01").catch((error: unknown) => {
  console.log(`5. ${error instanceof Error ? error.message : error}`);
});
console.log("2. still running");
await delay(50);
console.log("6. after the delay");
```

```text
1. asking
2. still running
3. ST-04 reads 17.5 C
4. done
5. unknown station XX-01
6. after the delay
```

The compiler knows `celsius` is a `number` from `Promise<number>`. A rejection's reason can be
anything, so treat it as `unknown`, as with `catch` blocks in the basic level.

## `async` and `await`

An **`async` function** always returns a promise. Inside it, **`await`** pauses the function until
a promise settles, then gives its value, or throws its rejection. Code that waits now reads like
ordinary code, and `try`/`catch` works again:

```ts
interface Reading {
  station: string;
  celsius: number;
}

async function reading(id: string): Promise<Reading> {
  const celsius = await readStation(id);
  return { station: id, celsius };
}

async function report(ids: string[]): Promise<string[]> {
  const lines: string[] = [];
  for (const id of ids) {
    try {
      const result = await reading(id);
      lines.push(`${result.station}: ${result.celsius} C`);
    } catch (error) {
      lines.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return lines;
}

const lines = await report(["ST-04", "XX-01", "ST-1"]);
console.log(lines);
```

```text
[ 'ST-04: 17.5 C', 'XX-01: unknown station XX-01', 'ST-1: 14 C' ]
```

(`readStation` is the function from the previous example, placed after the interface.) The
declared return type of an `async`
function is always `Promise<...>`: `reading` returns a `Reading` object, and the caller receives a
`Promise<Reading>`. A `throw` inside an `async` function rejects its promise.

## Errors, and the forgotten `await`

The most common async bug is leaving out `await`. You then hold a promise, not its value. The
compiler catches most cases. Add these lines to the program above:

```ts
const first: Reading = reading("ST-04");
async function isWarm(id: string): Promise<boolean> {
  return (await readStation(id)) > 20;
}
if (isWarm("ST-04")) {
  console.log("warm");
}
function sync(): number {
  const value = await readStation("ST-04");
  return value;
}
```

```text
main.ts(38,7): error TS2739: Type 'Promise<Reading>' is missing the following properties from type 'Reading': station, celsius
main.ts(42,5): error TS2801: This condition will always return true since this 'Promise<boolean>' is always defined.
main.ts(46,17): error TS1308: 'await' expressions are only allowed within async functions and at the top levels of modules.
```

A promise object is always truthy, so `if (isWarm(...))` would always run. And `await` needs an
`async` function around it. One case the compiler does not catch is calling an `async` function
as a statement without `await`: it runs, but a rejection then goes unhandled, and Node.js ends
the process with an error. Always `await` a promise, return it, or attach a `catch`.

## Running work concurrently

`report` awaits each station in turn, so three readings take three times as long as one. When the
operations do not depend on each other, start them all and wait for them together. Four static
methods combine promises, and each starts nothing itself: it waits for promises already running.

```ts
function readStation(id: string, ms: number): Promise<number> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id.startsWith("ST")) {
        resolve(id.length * 3.5);
      } else {
        reject(new Error(`unknown station ${id}`));
      }
    }, ms);
  });
}

const [north, south] = await Promise.all([readStation("ST-N", 30), readStation("ST-SOUTH", 10)]);
console.log("all:", north, south);

try {
  await Promise.all([readStation("ST-N", 30), readStation("XX-9", 10)]);
} catch (error) {
  console.log("all rejected:", error instanceof Error ? error.message : error);
}

const outcomes = await Promise.allSettled([readStation("ST-N", 30), readStation("XX-9", 10)]);
for (const outcome of outcomes) {
  console.log(outcome.status === "fulfilled" ? outcome.value : String(outcome.reason));
}

const fastest = await Promise.race([readStation("ST-N", 30), readStation("ST-SOUTH", 10)]);
console.log("race:", fastest);

const firstGood = await Promise.any([readStation("XX-1", 5), readStation("ST-N", 30)]);
console.log("any:", firstGood);

try {
  await Promise.any([readStation("XX-1", 5), readStation("XX-2", 10)]);
} catch (error) {
  console.log(error instanceof AggregateError ? `${error.name}: ${error.errors.length} failures` : error);
}
```

```text
all: 14 28
all rejected: unknown station XX-9
14
Error: unknown station XX-9
race: 28
any: 14
AggregateError: 2 failures
```

- **`Promise.all`** fulfills with an array of all values, in the order given (not the order they
  finished), and rejects as soon as any one rejects. The result type is a tuple,
  `[number, number]`, so it destructures cleanly.
- **`Promise.allSettled`** never rejects. It gives one object per promise, a discriminated union
  on `status`: `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`.
- **`Promise.race`** settles like the first promise to settle, success or failure.
- **`Promise.any`** fulfills with the first success, and rejects with an `AggregateError` holding
  every reason only if all of them fail.

## Top-level `await`

The examples used `await` outside any function. That is allowed at the top level of an **ES
module**, which every file in this course is (lesson 1). Node.js waits for the awaited promise
before the module counts as loaded, so a module that imports this one waits too. In a CommonJS
file, top-level `await` is a syntax error.

## Common mistakes

- **Forgetting `await`**: errors TS2739 or TS2801 when the result is used, an unhandled rejection
  when it is not.
- **Awaiting in a loop when order does not matter.** Use `Promise.all(ids.map(load))`.
- **`Promise.all` when partial results are fine.** One failure rejects everything; use
  `allSettled`.
- **Annotating an async function's value type**: `async function f(): Reading` is error TS1064:

  ```text
  main.ts(2,21): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<Reading>'?
  ```

## Practice

1. Write `withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>` that rejects with
   `timed out after <ms> ms` if `promise` takes longer than `ms`.
2. Write `averageOf(ids)` that reads all stations concurrently and returns their average.
3. A dashboard shows every station's reading and an error for stations that fail. Which
   combinator fits?

### Answers

```ts
function readStation(id: string, ms: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(id.length * 3.5), ms);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]);
}

async function averageOf(ids: string[]): Promise<number> {
  const values = await Promise.all(ids.map((id) => readStation(id, 10)));
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

console.log(await withTimeout(readStation("ST-N", 10), 50));
try {
  await withTimeout(readStation("ST-N", 50), 10);
} catch (error) {
  console.log(error instanceof Error ? error.message : error);
}
console.log(await averageOf(["ST-N", "ST-SOUTH"]));
```

```text
14
timed out after 10 ms
21
```

`Promise<never>` describes a promise that can only reject. 3: `Promise.allSettled`.

## Key takeaways

- A promise is pending, then fulfilled with a value or rejected with a reason; `Promise<T>` names
  the value.
- `async` functions return `Promise<T>`; `await` unwraps it and turns rejections into exceptions.
- The compiler flags most forgotten `await`s; never leave a promise unhandled.
- `all` for every value, `allSettled` for every outcome, `race` for the first to settle, `any`
  for the first success.

## Further reading

- [MDN: Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
