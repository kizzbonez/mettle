Write three standard decorators and one helper in `solution.ts`. The starter gives their
signatures, the `Symbol.metadata` polyfill and the `esnext.decorators` library reference; keep
those two lines at the top. Hidden tests decorate classes of their own, and check with
`@ts-expect-error` that each decorator is refused where it does not fit.

1. **`@clamp(min, max)`** is a decorator factory for an `accessor` field holding a number. It
   keeps the value between `min` and `max`: the initial value (`init`) and every assignment (the
   replacement `set`) are moved to the nearest limit when outside them. Values inside, and the
   limits themselves, are kept as they are. The starter's types already refuse it on a string
   accessor or a plain field: keep them.
2. **`@recorded`** is a method decorator. Each call of the decorated method first pushes
   `` `${name}(${args})` `` onto the instance's `log` array, with the method's name from the
   context and the arguments joined by `", "` (so `preheat(180)`, `bake(25, fan)`, `clean()`),
   then calls the original method with the same `this` and arguments and returns its result. A
   call is logged even when the method then throws. Constrain the `This` type parameter to
   `{ log: string[] }`, so `@recorded` on a class without a `log` does not compile.
3. **`@shown`** is a decorator for plain fields that adds the field's name to a `shown` list in
   `context.metadata` (create the list the first time).
4. **`shownFields(type)`** returns the names of a class's `@shown` fields in the order they were
   declared, read from `type[Symbol.metadata]`, as a new array. A class without any `@shown`
   field gives `[]`.

Example:

```ts
class Oven {
  log: string[] = [];
  @clamp(50, 250) accessor temperature = 300;
  @shown mode = "fan";
  @shown timer = 0;
  serial = "OV-1";

  @recorded
  preheat(to: number): string {
    this.temperature = to;
    return `heating to ${this.temperature}`;
  }
}

const oven = new Oven();
oven.temperature;          // 250: the initial 300 was clamped
oven.preheat(20);          // "heating to 50"
oven.log;                  // ["preheat(20)"]
shownFields(Oven);         // ["mode", "timer"]
```
