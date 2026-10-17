Validate the form's JSON at run time. Treat what `JSON.parse` returns as `unknown` and narrow
it; do not annotate it or use `as`. Some tests check your **types**: lines the compiler must
reject are marked `// @ts-expect-error`.

1. **`Parsed<T>`**: a discriminated union on `ok`, either `{ ok: true; value: T }` or
   `{ ok: false; errors: string[] }`, so that a caller must check `ok` before reading `value`.
2. **`isStringArray(value: unknown): value is string[]`**: `true` for an array whose items are
   all strings, including an empty array.
3. **`parseDay(text: string): Date | undefined`** accepts only a real date written `YYYY-MM-DD`,
   as the lesson's `parseDay` does: `"2026-02-30"` rolls over into March, so it is refused.
4. **`parseDonation(text: string): Parsed<Donation>`** parses one message:
   - Text that is not JSON gives the errors `["not valid JSON"]`; JSON that is not a plain object
     (an array, `null`, a number, a string) gives `["expected an object"]`.
   - Otherwise check every field and report **every** problem, in this order, with exactly
     these messages:

     | field        | rule                                                     | message                                              |
     | ------------ | -------------------------------------------------------- | ---------------------------------------------------- |
     | `donor`      | a string, not empty after trimming                       | `donor must be a non-empty string`                   |
     | `item`       | the same                                                 | `item must be a non-empty string`                    |
     | `portions`   | a number (not text) that is a whole number from 1 to 50  | `portions must be a whole number from 1 to 50`       |
     | `bestBefore` | a string that `parseDay` accepts                         | `bestBefore must be a real date written YYYY-MM-DD`  |
     | `allergens`  | missing, or an array of strings                          | `allergens must be a list of strings`                |

   - With no problems, return `{ ok: true, value }`, where `donor` and `item` are trimmed,
     `bestBefore` is the `Date`, and a missing `allergens` becomes `[]`. Other fields are ignored.

Example:

```ts
parseDonation('{"donor":" Bakery Lind ","item":"rye bread","portions":6,"bestBefore":"2026-10-19"}')
// { ok: true, value: { donor: "Bakery Lind", item: "rye bread", portions: 6,
//                      bestBefore: new Date("2026-10-19"), allergens: [] } }
parseDonation('{"donor":"","item":"soup","portions":"4","bestBefore":"2026-02-30","allergens":["celery"]}')
// { ok: false, errors: ["donor must be a non-empty string",
//                       "portions must be a whole number from 1 to 50",
//                       "bestBefore must be a real date written YYYY-MM-DD"] }
parseDonation("{ portions: 4 }")    // { ok: false, errors: ["not valid JSON"] }
parseDay("2026-02-30")              // undefined
```
