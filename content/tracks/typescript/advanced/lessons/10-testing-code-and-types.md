---
title: Testing Code and Types
summary: Write tests with node:test and node:assert, run them with node --test on TypeScript files, replace dependencies and timers with mocks, test async code without real waiting, and test types themselves with @ts-expect-error and a type equality check.
minutes: 40
objectives:
  - Write and run tests with `node:test`, `describe`, `it` and `node:assert/strict`
  - Replace functions and timers with `mock.fn` and `mock.timers`, and test async code deterministically
  - Write type-level tests with `@ts-expect-error` and an `Equal` type, and keep them from running
  - Organize test files and run type checks and tests together
---

## Outline

1. Why test, and what with
2. A first test file
3. Mocks and async code
4. Controlling time with mock timers
5. Testing types
6. Organizing tests

## Why test, and what with

The compiler proves that values have the right *types*; a test proves that code gives the right
*results*. You need both, and for generic or overloaded code you also want tests for the types:
that a misuse is rejected. Node.js includes a test runner, the `node:test` module, and an
assertion library, `node:assert`, so no package is needed; libraries such as Vitest work alike.

Node.js 26 runs `.ts` files by stripping types, and `node --test` finds files named like
`*.test.ts` on its own. The test files import each other with `.ts` extensions, so `tsc` is used
only to type-check. The `tsconfig.json` is the course's usual one with two changes, `noEmit` and
`allowImportingTsExtensions` (and `"type": "module"` stays in `package.json`):

```json
{
  "compilerOptions": {
    "target": "es2025",
    "lib": ["es2025"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "types": ["node"]
  }
}
```

## A first test file

The code under test splits a bill in cents and retries a payment:

```ts
// split-bill.ts
export function splitBill(totalCents: number, people: number): number[] {
  if (!Number.isInteger(people) || people < 1) throw new RangeError(`people must be 1 or more, got ${people}`);
  const base = Math.floor(totalCents / people);
  const leftover = totalCents - base * people;
  return Array.from({ length: people }, (_, index) => (index < leftover ? base + 1 : base));
}

export async function retry<T>(attempt: () => Promise<T>, times: number): Promise<T> {
  let lastError: unknown;
  for (let round = 1; round <= times; round++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`gave up after ${times} attempts`, { cause: lastError });
}
```

A test is a function given to `test` (or its alias `it`); it fails if it throws or its promise
rejects. `describe` groups tests. `node:assert/strict` compares with `===` and deep strict
equality:

```ts
// split-bill.test.ts
import { describe, it, mock, test } from "node:test";
import assert from "node:assert/strict";
import { retry, splitBill } from "./split-bill.ts";

describe("splitBill", () => {
  it("splits evenly", () => {
    assert.deepEqual(splitBill(900, 3), [300, 300, 300]);
  });
  it("gives leftover cents to the first people", () => {
    assert.deepEqual(splitBill(1000, 3), [334, 333, 333]);
  });
  it("rejects zero people", () => {
    assert.throws(() => splitBill(100, 0), RangeError);
  });
});

test("retry tries again after a failure", async () => {
  const attempt = mock.fn(async () => "paid");
  attempt.mock.mockImplementationOnce(async () => {
    throw new Error("busy");
  });
  assert.equal(await retry(attempt, 3), "paid");
  assert.equal(attempt.mock.callCount(), 2);
});

test("retry gives up and keeps the last error", async () => {
  const attempt = mock.fn(async (): Promise<string> => {
    throw new Error("card declined");
  });
  await assert.rejects(retry(attempt, 2), { message: "gave up after 2 attempts" });
  assert.equal(attempt.mock.callCount(), 2);
});
```

```console
$ npx tsc
$ node --test
▶ splitBill
  ✔ splits evenly (1.373129ms)
  ✔ gives leftover cents to the first people (0.201403ms)
  ✔ rejects zero people (0.614259ms)
✔ splitBill (3.744508ms)
✔ retry tries again after a failure (0.710386ms)
✔ retry gives up and keeps the last error (0.483153ms)
ℹ tests 5
ℹ suites 1
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 192.152301
```

The times differ on every run. `tsc` printed nothing, so the types are fine; `node --test` exits
with code 1 if any test fails, which is what a CI job checks.

## Mocks and async code

A **mock** stands in for a real dependency, here a payment call that would need a network.
`mock.fn(impl)` returns a function that records every call: `mock.callCount()`,
`mock.calls[i].arguments`, `mock.calls[i].result`. `mockImplementationOnce` changes what the
next call does, so the first attempt fails and the second succeeds, every time.

An async test returns a promise; `await assert.rejects(promise, expected)` checks a rejection.
Forgetting the `await` is a real bug: the test ends before the check runs. Async code is tested
deterministically by controlling what each awaited call does: resolved and rejected promises,
`setImmediate`, and an `AbortController` you abort yourself, never by waiting a number of
milliseconds and hoping.

## Controlling time with mock timers

Code that uses `setTimeout` is tested with **mock timers**: `t.mock.timers.enable` replaces the
timer functions, and `tick(ms)` moves a fake clock forward instantly. Using `t.mock` instead of
`mock` restores everything when the test ends:

```ts
// debounce.ts
export function debounce<A extends unknown[]>(fn: (...args: A) => void, waitMs: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}
```

```ts
// debounce.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { debounce } from "./debounce.ts";

test("debounce calls once, with the last arguments, after the quiet period", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const save = t.mock.fn((draft: string) => draft.length);
  const debounced = debounce(save, 300);

  debounced("h");
  debounced("he");
  debounced("hey");
  t.mock.timers.tick(299);
  assert.equal(save.mock.callCount(), 0);
  t.mock.timers.tick(1);
  assert.equal(save.mock.callCount(), 1);
  assert.deepEqual(save.mock.calls[0].arguments, ["hey"]);
});

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

function typeTests(): void {
  const typed = debounce((id: number, note: string) => console.log(id, note), 10);
  type Cases = [Expect<Equal<Parameters<typeof typed>, [id: number, note: string]>>];
  // @ts-expect-error the first argument must be a number
  typed("7", "late");
}
```

The test passes in a millisecond, though it covers 300 ms of timer time.

## Testing types

The end of `debounce.test.ts` tests the *types*. `// @ts-expect-error` above a line says "this
line must not compile". If it does compile, `tsc` reports the directive itself as unused.
`Equal<A, B>` is true only when two types are identical (it compares how each behaves inside a
generic conditional type), and `Expect` accepts only `true`. Both checks run when `tsc` runs.

To see them work, replace `debounce` with a loose version whose type is
`(fn: (...args: any[]) => void, waitMs: number) => (...args: any[]) => void`, and which waits
`waitMs + 1`:

```console
$ npx tsc
debounce.test.ts(25,24): error TS2344: Type 'false' does not satisfy the constraint 'true'.
debounce.test.ts(26,3): error TS2578: Unused '@ts-expect-error' directive.
$ node --test
✖ debounce calls once, with the last arguments, after the quiet period (2.734673ms)
```

Both type tests catch the `any`, and the run test catches the extra millisecond. The failure
report goes on to show `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:`
with `0 !== 1`, and the line of the test file.

The type tests sit in a function that is never called, because they are ordinary code: at the
top level, `typed("7", "late")` would really run during the tests. Write the reason after
`@ts-expect-error`; it documents what the line proves.

## Organizing tests

- Name files `*.test.ts`, next to the code they test or in a `test/` folder; `node --test` finds
  both.
- One behavior per test, with a name that states it. Use `describe` to group, and `beforeEach`
  for shared setup.
- Test the edges: empty input, one item, the limits, every error.
- Run both checks together, for example as the npm script `"test": "tsc && node --test"`,
  so neither the types nor the behavior can break unnoticed.

## Common mistakes

- **Not awaiting** `assert.rejects` or a subtest: the test may pass before the check runs.
- **Real waiting.** `setTimeout(check, 500)` makes slow, flaky tests; use mock timers.
- **`@ts-expect-error` without a reason**, or on a line that fails for a different reason, such as
  a typo. Keep the line minimal so it can only fail the way you mean.
- **Mocks that leak** into other tests: use `t.mock`, which restores itself.

## Practice

1. Write tests for `splitBill(1, 3)`: the shares, that no cent is lost, and that `2.5` people is
   rejected. Share the setup with `beforeEach`.
2. Add type tests: `splitBill` returns `number[]`, and `splitBill("900", 3)` is rejected.

### Answers

```ts
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { splitBill } from "./split-bill.ts";

describe("splitBill edge cases", () => {
  let shares: number[] = [];
  beforeEach(() => {
    shares = splitBill(1, 3);
  });
  it("gives a single cent to the first person", () => {
    assert.deepEqual(shares, [1, 0, 0]);
  });
  it("never loses a cent", () => {
    assert.equal(shares.reduce((sum, share) => sum + share, 0), 1);
  });
  it("rejects a fractional number of people", () => {
    assert.throws(() => splitBill(100, 2.5), { name: "RangeError", message: /2\.5/ });
  });
});

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

function typeTests(): void {
  type Cases = [Expect<Equal<ReturnType<typeof splitBill>, number[]>>];
  // @ts-expect-error the total must be a number of cents
  splitBill("900", 3);
}
```

```text
▶ splitBill edge cases
  ✔ gives a single cent to the first person (2.979481ms)
  ✔ never loses a cent (0.608068ms)
  ✔ rejects a fractional number of people (1.445434ms)
✔ splitBill edge cases (7.652761ms)
```

The summary lines follow. `assert.throws` accepts an object whose properties the error must
match, here with a regular expression for the message.

## Key takeaways

- `node:test` and `node:assert/strict` need no packages; `node --test` runs `*.test.ts` files.
- `mock.fn` records calls and scripts results; `t.mock.timers` replaces waiting with `tick`.
- Async tests return promises; always `await` the checks.
- `@ts-expect-error` and `Expect<Equal<...>>` test types when `tsc` runs; keep them from running.

## Further reading

- [Node.js 26: Test runner](https://nodejs.org/docs/latest-v26.x/api/test.html)
- [Node.js 26: Assert](https://nodejs.org/docs/latest-v26.x/api/assert.html)
- [TypeScript 3.9 release notes: @ts-expect-error comments](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html)
