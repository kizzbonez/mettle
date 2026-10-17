Write `solution.ts`, the TypeScript version of the module below (it is also in the lab's data as
`data/split-bill.js`). Two things are judged. The **behaviour must not change**: one test runs
the original next to yours on hundreds of bills and compares every answer. And the **types must
say what the JSDoc meant**, more strictly where noted: the other tests are mostly type-level
tests, `@ts-expect-error` lines your types must reject and calls they must accept.

```js
// @ts-check
/**
 * How the service was.
 * @enum {string}
 */
export const Service = { POOR: "poor", GOOD: "good", GREAT: "great" };

/** The tip for each kind of service, in percent. */
export const TIP_PERCENT = { poor: 5, good: 10, great: 15 };

/**
 * @typedef {Object} Share
 * @property {string} diner
 * @property {number} cents
 */

/**
 * Adds the tip and splits the bill evenly, each share rounded up to a multiple of roundTo.
 * @param {number} totalCents
 * @param {string[]} diners
 * @param {Service} service
 * @param {number} [roundTo] round each share up to a multiple of this many cents
 * @returns {Share[]}
 */
export function splitBill(totalCents, diners, service, roundTo = 1) {
  if (diners.length === 0) throw new RangeError("nobody to split the bill between");
  const withTip = Math.round((totalCents * (100 + TIP_PERCENT[service])) / 100);
  const each = Math.ceil(withTip / diners.length / roundTo) * roundTo;
  return diners.map((diner) => ({ diner, cents: each }));
}

/**
 * One line per share, in the format the caller chooses.
 * @param {Share[]} shares
 * @param {function(Share): string} format
 * @returns {string}
 */
export function receipt(shares, format) {
  return shares.map((share) => format(share)).join("\n");
}

/**
 * @param {Share[]} shares
 * @returns {number}
 */
export function totalOf(shares) {
  return shares.reduce((sum, share) => sum + share.cents, 0);
}
```

1. **`Service`**: `@enum` is gone in TypeScript 7, and `{Service}` names a value. Export the
   object `as const`, and a type also named `Service` that is exactly `"poor" | "good" |
   "great"`, derived from the object. Neither `Service.GOOD = "good"` nor a service such as
   `"superb"` may compile.
2. **`TIP_PERCENT`**: read-only, with exactly one number for each `Service`, so
   `TIP_PERCENT.great = 20` and `TIP_PERCENT["superb"]` do not compile.
3. **`Share`**: an interface with `readonly diner: string` and `readonly cents: number`.
4. **The functions**, with the bodies of the original:
   - `splitBill(totalCents: number, diners: readonly string[], service: Service, roundTo = 1): Share[]`
   - `receipt(shares: readonly Share[], format: (share: Share) => string): string`, where the
     Closure type `function(Share): string` becomes an arrow function type;
   - `totalOf(shares: readonly Share[]): number`.

   Taking `readonly` arrays is stricter than the JSDoc and lets callers pass `as const` lists.

Example:

```ts
const table = ["Ana", "Bo", "Cy"] as const;
const shares = splitBill(4999, table, Service.GOOD, 5);
// [{ diner: "Ana", cents: 1835 }, { diner: "Bo", cents: 1835 }, { diner: "Cy", cents: 1835 }]
receipt(shares, (share) => `${share.diner}: ${(share.cents / 100).toFixed(2)}`)
// "Ana: 18.35\nBo: 18.35\nCy: 18.35"
totalOf(shares)                       // 5505
splitBill(4999, table, "superb")      // compile error: not a Service
```

**Tip:** `(typeof Service)[keyof typeof Service]` is the union of the object's values once the
object is `as const`. A value and a type may share a name; each import brings both.
