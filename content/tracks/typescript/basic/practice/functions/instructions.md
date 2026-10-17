Complete the four exported functions in `solution.ts`. Tasks 1 to 3 also need parameters added to
their first line: when you are done, the first lines must read exactly as given here.

1. **`orderLine(flavour: string, scoops = 1, topping?: string): string`** returns
   `"<scoops> x <flavour>"`, followed by `" with <topping>"` only when a topping was given.
   `scoops` has a **default** value of 1, and `topping` is **optional**, so check it against
   `undefined` before you use it.
2. **`totalCents(...prices: number[]): number`** has a **rest** parameter: it can be called with
   any number of prices, and returns their total. With no prices at all it returns 0.
3. **`priceWithOffer(cents: number, offer: (cents: number) => number): number`** takes the
   day's offer as a **function**. Call `offer` with `cents`, round its result to a whole number
   of cents (`Math.round`), and never return less than 0 (`Math.max`).
4. **`makeLoyaltyCard(freeEvery: number): () => boolean`** returns a new function, the card.
   Each call of the card stamps one ice cream and returns `true` when that ice cream is free:
   every `freeEvery`-th one, so the third, sixth, ninth and so on when `freeEvery` is 3. Keep
   the count in a `let` inside `makeLoyaltyCard`, so that the card is a **closure** and every
   card has its own count.

Example:

```ts
orderLine("mango")                           // "1 x mango"
orderLine("mango", 2)                        // "2 x mango"
orderLine("pistachio", 3, "sprinkles")       // "3 x pistachio with sprinkles"
totalCents(250, 300, 175)                    // 725
totalCents()                                 // 0
priceWithOffer(350, (cents) => cents - 100)  // 250
priceWithOffer(325, (cents) => cents / 2)    // 163: half of 325 is 162.5, rounded
priceWithOffer(80, (cents) => cents - 100)   // 0, not -20

const card = makeLoyaltyCard(3);
card();  // false
card();  // false
card();  // true: the third ice cream is free
card();  // false
```
