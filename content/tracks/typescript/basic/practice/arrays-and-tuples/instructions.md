Write the four exported functions in `solution.ts`. Each takes `readings: readonly number[]`, the
rain of each day in millimetres; keep those parameters `readonly`, because a test passes arrays
that may not be changed.

1. **`totalRain(readings: readonly number[]): number`** returns the total of all readings, or 0
   for an empty array. Use `reduce` with a starting value.
2. **`wetDays(readings: readonly number[]): number`** returns how many readings are above 0. Use
   `filter`.
3. **`driestAndWettest(readings: readonly number[]): [number, number]`** returns a **tuple**:
   the lowest reading, then the highest. The starter's return type is `number[]`: change it to
   the tuple type `[number, number]`. A test checks that your type rejects reading a third
   element. Spread the readings into `Math.min` and `Math.max`. The array always holds at least
   one reading.
4. **`wettestReadings(readings: readonly number[], count: number): number[]`** returns the
   `count` highest readings, highest first. Sort a **copy** with `toSorted` and a comparator,
   then keep the first `count` elements with `slice(0, count)`, which works on arrays as it does
   on strings. When there are fewer readings than `count`, return them all.

Example:

```ts
const april = [0, 12.5, 3, 0, 22, 0.5, 0];
totalRain(april)            // 38
wetDays(april)              // 4
driestAndWettest(april)     // [0, 22]
wettestReadings(april, 3)   // [22, 12.5, 3]
april                       // still [0, 12.5, 3, 0, 22, 0.5, 0]
```
