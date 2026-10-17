Write three types and one function in `solution.ts`. `CupSize` is given. Hidden tests compare
the types exactly (`Expect<Equal<A, B>>`) and use `@ts-expect-error` lines, so a type that is
too loose fails even when the code runs.

1. **`Patch<T>`** has every property of `T`, each **optional** and **not readonly**, with the
   same type. `Patch<{ readonly id: number; note?: string }>` is `{ id?: number; note?: string }`,
   so `patch.id = 7` compiles.
2. **`Setters<T>`** has one method for each string key of `T` whose type is **not a function**,
   named `set` followed by the key with its first letter in upper case and taking a value of
   that property's type: `{ temperature: number; clean: () => void }` gives exactly
   `{ setTemperature: (value: number) => void }`. Use `as` with a template literal and
   `Capitalize`, and map the keys of functions to `never`.
3. **`makeSetters(target)`** returns a `Setters<T>` object for any object `target`: one function
   for each of its own keys whose value is not a function (check with `typeof`), which assigns
   the value to that key **of `target` itself**. `Object.keys` gives `string[]`, so work through a
   `Record<string, unknown>` view of the target and cast the finished object to `Setters<T>`, as
   the lesson's `buildPath` does with its parameters.
4. **`TicketParts<S>`** reads a ticket of the form `SIZE-DRINK`, where `SIZE` is a `CupSize`, and
   gives `{ size: SIZE; drink: DRINK }` with both parts as literal types. The drink is everything
   after the first `-`. Anything else, such as `"huge-latte"` or `"latte"`, gives `never`.

Example:

```ts
interface Order { readonly id: number; drink: string; shots: number; note?: string }
const change: Patch<Order> = { shots: 3 };
change.id = 12;                     // allowed: a patch is not readonly

const machine = { grinder: "fine", temperature: 93, steam: false, clean() { console.log("rinse"); } };
const panel = makeSetters(machine);
panel.setTemperature(94);           // machine.temperature is now 94
panel.setSteam("on");               // compile error: steam is a boolean
panel.setClean(() => {});           // compile error: methods get no setter

type Ticket = TicketParts<"large-flat white">;   // { size: "large"; drink: "flat white" }
type Wrong = TicketParts<"huge-latte">;          // never
```
