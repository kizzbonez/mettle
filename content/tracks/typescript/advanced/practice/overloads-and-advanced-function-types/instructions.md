Complete `solution.ts`. The starter's signatures compile but are too loose: hidden tests check
them with exact type comparisons and `@ts-expect-error` lines, so fix the types as the TODOs ask
as well as writing the bodies.

1. **`formatStay(minutes, style)`** turns a whole number of minutes (0 or more) into hours and
   minutes. Give it three overload signatures:
   - with `style` `"clock"` it returns a `string` such as `"2:05"`: the hours, a colon, and the
     minutes as two digits; hours do not wrap at 24 (`1505` is `"25:05"`);
   - with `style` `"parts"` it returns the tuple `[hours: number, minutes: number]`, such as
     `[2, 5]`;
   - a last overload takes `style: "clock" | "parts"` and returns
     `string | [hours: number, minutes: number]`, for callers whose style is only known at run
     time.
2. **`Barrier`** has `open` and `raises`, and the methods `raise()` and `lower()`. Give both
   methods a `this` parameter of type `Barrier`, so calling a method taken off its barrier does
   not compile. **`createBarrier()`** returns a new closed barrier with `raises` at `0`. `raise()`
   opens it, adds one to `raises` and returns the new count; `lower()` closes it. Both work
   through `this`, so they change whichever barrier they are called on.
3. **`limitCalls(fn, max)`** returns a function with exactly the parameters of `fn`. Each of the
   first `max` calls passes its arguments to `fn` and returns its result; after that it returns
   `undefined` without calling `fn`. Its return type is `R | undefined`, where `R` is what `fn`
   returns. Capture the parameter list with a rest type parameter `A extends unknown[]`.

Example:

```ts
formatStay(125, "clock");             // "2:05", typed string
formatStay(125, "parts");             // [2, 5], typed [hours: number, minutes: number]

const exit = createBarrier();
exit.raise();                         // 1, and exit.open is true
exit.lower();                         // exit.open is false
const raise = exit.raise;
raise();                              // compile error: 'this' must be a Barrier

const freeExit = limitCalls((plate: string, minutes: number) => `${plate} out after ${minutes} min`, 2);
freeExit("KD-482", 12);               // "KD-482 out after 12 min"
freeExit("KD-482", 30);               // "KD-482 out after 30 min"
freeExit("KD-482", 45);               // undefined
freeExit(482, 12);                    // compile error: the plate is a string
```
