Finish the `SeatError` class and write the two exported functions. `Seat` is complete.

1. **`SeatError`** is a custom error class for codes that are not written like a seat. Add a
   field `code: string`, and a second constructor parameter that sets it, so that you create one
   with `new SeatError(message, code)`. In the constructor, after `super(message)`, set
   `this.name` to `"SeatError"`. A test checks that a `SeatError` cannot be created without its
   code.
2. **`parseSeat(code: string): Seat`** reads a seat code such as `C-12`: a row letter, a dash,
   then a seat number. Remove spaces around the code and turn it into capitals, then split it at
   `"-"`. Check, in this order:
   - not exactly two parts, a row part that is not exactly one character, an empty number part,
     or a number part that is not a whole number: throw
     ``new SeatError(`"${code}" is not a seat code`, code)``, with the code exactly as it was
     given;
   - a row before `A` or after `J`, or a seat number below 1 or above 20: throw a built-in
     `RangeError` with the message `there is no seat <row>-<number>`, for example
     `there is no seat K-5`;
   - otherwise return the seat, such as `{ row: "C", number: 12 }`.
3. **`bookSeats(codes: readonly string[]): string[]`** returns one line per code, in order. Call
   `parseSeat` inside `try`, and in `catch`, narrow the `unknown` error with `instanceof`:
   - the seat was read: `booked <row>-<number>`;
   - a `SeatError`: `ask again: <its message>`;
   - a `RangeError`: `refused: <its message>`;
   - anything else: throw it again.

   One bad code must not stop the codes after it from being booked.

Example:

```ts
parseSeat("C-12")    // { row: "C", number: 12 }
parseSeat(" b-3 ")   // { row: "B", number: 3 }
parseSeat("C12")     // throws a SeatError: message "\"C12\" is not a seat code", code "C12"
parseSeat("K-5")     // throws a RangeError: message "there is no seat K-5"

bookSeats(["C-12", "C12", "K-5", "d-7"])
// [
//   "booked C-12",
//   "ask again: \"C12\" is not a seat code",
//   "refused: there is no seat K-5",
//   "booked D-7",
// ]
```
