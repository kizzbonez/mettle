Write `solution.ts`. The starter declares every export the tests use. `CATEGORIES`, `Category`,
`Ticket`, `Rejection`, `LoadResult`, `PartsShop`, `PartsQuote` and `TicketError` are complete;
keep them as they are. Finish the two types in tasks 1 and 2 and the six functions in tasks 3 to 8.
You may add helper functions and types. Some tests check your **types**: lines the compiler must
reject are marked `// @ts-expect-error`, so a type that is too loose fails a test.

1. **`Outcome`**: a discriminated union on `status` with exactly four members:
   - `{ status: "waiting" }`
   - `{ status: "fixed"; minutes: number }`
   - `{ status: "needs-part"; part: string }`
   - `{ status: "unrepairable"; reason: string }`

   A fixed outcome without `minutes`, or a waiting outcome with a `part`, must not type-check.
2. **`TicketUpdate`**: derive it from `Ticket` with utility types so that it holds `owner`, `item`
   and `outcome`, each optional, and nothing else (no `id`, no `category`).
3. **`parseTicket(value: unknown): Ticket`** validates one entry from the JSON file. Check in this
   order and throw `new TicketError(field, message)` at the first problem, with `field` exactly as
   shown (any message):
   - `"ticket"`: the value is not a plain object (`null`, an array, a string, ...);
   - `"id"`: `id` is not a string of the form `T-` followed by exactly three digits (`T-007`).
     The id is not trimmed;
   - `"owner"`: `owner` is not a string, or is empty after trimming;
   - `"item"`: the same rule for `item`;
   - `"category"`: `category` is not exactly one of `CATEGORIES`;
   - `"outcome"`: `outcome` is not an object whose `status` is one of the four statuses with its
     details valid: `minutes` a whole number of at least 1; `part` and `reason` strings that are
     not empty after trimming.

   Return a **new** ticket with `owner`, `item`, `part` and `reason` trimmed. Copy only the fields
   a ticket and its kind of outcome have: a `note` inside a fixed outcome, or `minutes` inside a
   waiting one, is dropped.
4. **`loadTickets(file: string): Promise<LoadResult>`** reads the file with `readFile` from
   `node:fs/promises` (UTF-8) and parses it with `JSON.parse`.
   - Invalid JSON: let the `SyntaxError` reject the promise. A missing file: let Node's error
     reject it. Do not catch either.
   - JSON that is not an array: reject with a `TicketError` whose field is `"tickets"`.
   - Otherwise parse each entry with `parseTicket`. Keep valid tickets in file order in
     `tickets`. For each entry that throws a `TicketError`, add `{ index, field }` to `rejected`
     (index counts from 0) and carry on. An entry whose id was already accepted earlier in the
     file is rejected with field `"id"`.
5. **`describeOutcome(outcome: Outcome): string`** with an exhaustive `switch`:
   `waiting for a volunteer`, `fixed in 25 min`, `needs part: brass zip`,
   `unrepairable: cracked base`. If a value outside the union reaches it at run time, throw an
   `Error` (the `assertNever` pattern does this).
6. **`countBy`** has exactly this signature:

   ```ts
   export function countBy<T, K extends string>(items: readonly T[], keyOf: (item: T) => K): Map<K, number>
   ```

   It counts how many items share each key, with the keys in the order they were first seen.
   Because `K` is generic, `countBy(tickets, (t) => t.outcome.status)` is a
   `Map<Outcome["status"], number>`, and a key function returning a number does not type-check.
7. **`applyUpdate(ticket: Readonly<Ticket>, update: TicketUpdate): Ticket`** returns a new ticket
   with the fields from `update` replaced. The original is not changed.
8. **`costParts(tickets: readonly Ticket[], shop: PartsShop): Promise<PartsQuote>`** prices the
   parts the tickets need. The tests give you the shop: `shop.priceOf(part)` resolves to a price
   in cents after a delay, or rejects when the shop does not stock the part.
   - Ask about each distinct part once, and send **all** the questions before awaiting any answer.
     Do not call the shop when no ticket needs a part.
   - `prices` maps every stocked part to its price; `unavailable` lists every rejected part. Both
     follow the order in which parts first appear among the tickets, whatever order the answers
     arrive in.
   - `totalCents` adds one price for every ticket that needs a stocked part, so two tickets that
     need a `brake cable` count it twice.
   - A rejection never rejects `costParts`.

Example, with `data/intake.json` (the tests read fixtures from `data/`):

```ts
const { tickets, rejected } = await loadTickets("data/intake.json");
tickets.map((t) => t.id);
// ["T-001", "T-002", "T-003", "T-005", "T-008", "T-009", "T-010", "T-011", "T-012"]
rejected;
// [{ index: 3, field: "category" }, { index: 5, field: "owner" },
//  { index: 6, field: "outcome" }, { index: 8, field: "id" }]
tickets[1].owner;                                   // "Tom Becker"
describeOutcome(tickets[1].outcome);                // "needs part: brass zip"
[...countBy(tickets, (t) => t.outcome.status)];
// [["fixed", 3], ["needs-part", 4], ["unrepairable", 1], ["waiting", 1]]

// with a shop that stocks "brass zip" at 350 and "brake cable" at 600:
const quote = await costParts(tickets, shop);
[...quote.prices];        // [["brass zip", 350], ["brake cable", 600]]
quote.unavailable;        // ["thermal fuse"]
quote.totalCents;         // 1550 (brass zip once, brake cable for two tickets)
```

**Tips.** Start with the `Outcome` type: once it is right, the compiler guides the rest. Write a
small `isRecord` type guard for "plain object". `Promise.allSettled` keeps its results in the
order of the promises you pass it.
