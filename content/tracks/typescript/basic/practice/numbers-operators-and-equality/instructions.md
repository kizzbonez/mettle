Write the body of `feeInCents(minutesText: string): number`, where the starter says
`YOUR CODE`. It returns the parking fee in cents, a whole number, for a stay given as text.

1. Convert `minutesText` with `Number`, which ignores spaces at the ends and gives `NaN` for
   anything that is not entirely a number, such as `"12px"` or `"1h30"`. Do not use `parseInt`,
   which reads `"12px"` as 12.
2. The first 15 minutes are free: subtract 15, but never go below 0. Use `Math.max`.
3. Every **started** hour of the minutes that are left costs 250 cents, so 1 to 60 minutes cost
   250, and 61 to 120 minutes cost 500. Use `Math.ceil`.
4. The fee is never more than 3000 cents. Use `Math.min`.
5. Do not test for `NaN` yourself: when the text is not a number, `NaN` goes through `Math.max`,
   `Math.ceil`, `*` and `Math.min` unchanged, and the function returns it. The tests check that
   with `Number.isNaN`, since `NaN === NaN` is false.

Example:

```ts
feeInCents("75")    // 250: 60 minutes after the free 15, one started hour
feeInCents("200")   // 1000: 185 minutes, four started hours
feeInCents(" 10 ")  // 0: still inside the free 15 minutes
feeInCents("900")   // 3000: fifteen started hours would be 3750, but the fee stops at 3000
feeInCents("abc")   // NaN
```
