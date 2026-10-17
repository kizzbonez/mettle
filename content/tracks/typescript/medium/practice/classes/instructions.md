Finish the three classes in `solution.ts`. Some tests check your **types**: lines the compiler
must reject are marked `// @ts-expect-error`, so a field that should be read-only but is not
fails a test.

1. **`Machine`**, an abstract class that implements `Describable`:
   - `static installed`: how many machines have been created, starting at 0. The constructor
     adds 1.
   - `readonly id: string`, set by the constructor.
   - The credit put in so far, in cents, in a hard-private field `#credit` that starts at 0. A
     getter `credit` reads it; there is no setter, so the credit cannot be assigned from outside.
   - `insert(cents: number): void` adds to the credit. It throws a `RangeError`, and changes
     nothing, unless `cents` is a whole number above 0.
   - `abstract price(): number` is one cycle's price in cents (already in the starter).
   - `start(): string`: when the credit is below `price()`, throw an `Error` and leave the credit
     as it was. Otherwise take the price from the credit (the rest stays for the next cycle) and
     return `"<id> started"`.
   - `describe(): string` returns `"<id>: <price> cents"`.
2. **`Washer extends Machine`**, built with `new Washer(id, hot)`, has `readonly hot: boolean`. A
   hot wash costs 450 cents, a cold one 350.
3. **`Dryer extends Machine`**, built with `new Dryer(id, minutes)`, has
   `readonly minutes: number`. It costs 50 cents for every started 10 minutes (`Math.ceil`). Its
   `describe()` is marked `override` and adds `, <minutes> min` to what `super.describe()`
   returns.
4. **No parameter properties.** Declare every field in the class body and assign it in the
   constructor, as the lesson's `WaterTank` does. A test reads your `solution.ts` to check that
   no constructor parameter is marked `public`, `private`, `protected` or `readonly`.

Example:

```ts
const washer = new Washer("W1", true);
washer.insert(200);
washer.insert(300);
washer.credit           // 500
washer.start()          // "W1 started"
washer.credit           // 50, kept for the next cycle
washer.describe()       // "W1: 450 cents"

const dryer = new Dryer("D2", 25);
dryer.describe()        // "D2: 150 cents, 25 min"
dryer.start()           // throws an Error: no credit yet
Machine.installed       // 2
Object.keys(washer)     // ["id", "hot"]: a #private field is not a property at all
```
