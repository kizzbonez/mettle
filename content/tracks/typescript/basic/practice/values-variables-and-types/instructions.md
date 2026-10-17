Write only between the two `YOUR CODE` lines of the starter. The tests import the names it
exports and check both their values and their types.

1. **Real types instead of `any`.** `lockerName`, `doors` and `openAllNight` are declared with
   `any`. Give each the primitive type that fits its value (`string`, `number` or `boolean`), or
   delete `: any` and let the compiler infer it. A test checks that your types now reject
   mistakes such as multiplying the locker's name.
2. **A value that changes.** `parcelsWaiting` starts at 7. Below its declaration, write three
   assignments, one for each event of the day, in this order: a courier delivers 5, customers
   collect 3, a second courier delivers 4. When you press Run, the compiler reports `TS2588`;
   change the declaration so that the name may be assigned again.
3. **Check an `unknown` value.** `lastScan` has the type `unknown`, so the compiler lets you do
   nothing with it until you check what it is. Write an `if` whose condition uses `typeof` to
   check that `lastScan` is a string, and inside its braces assign `lastScan.toUpperCase()` to
   `lastScanCode`. Keep `lastScan` as `unknown`: a test checks that it still is.

Example: when your code is right, the tests read these values.

```ts
lockerName     // "Corner Shop Locker", of type string
doors          // 24, of type number
openAllNight   // true, of type boolean
parcelsWaiting // 13: 7 + 5 - 3 + 4
doorsFree      // 11: 24 - 13, worked out by the last line of the file
lastScanCode   // "PARCEL-0042"
```
