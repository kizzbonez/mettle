Write four types and one function in `solution.ts`. Hidden tests compare the types exactly
(`Expect<Equal<A, B>>`) and use `@ts-expect-error` lines, so a type that is too loose fails even
when the code runs.

1. **`AsList<T>`** is `T` itself when `T` is an array type, readonly or not, and `T[]`
   otherwise. It distributes over unions: `AsList<string | number[]>` is `string[] | number[]`,
   and `AsList<readonly string[]>` stays `readonly string[]`.
2. **`asList(value)`** returns `value` itself when it is an array (the same array, not a copy)
   and a new one-item array holding it otherwise. Its return type is `AsList<T>` for a value of
   type `T`, so `asList("milk")` is a `string[]`. `Array.isArray` tells the cases apart at run
   time; the return needs a cast, as in the lesson.
3. **`Resolved<T>`** unwraps promises however deeply they are nested, and leaves other types as
   they are: `Resolved<Promise<Promise<string[]>>>` is `string[]` and `Resolved<number>` is
   `number`. Use `infer` with `PromiseLike` and let the type call itself.
4. **`HandlerResult<F>`** is what a handler function finally produces: its return type with
   promises unwrapped by `Resolved`. Constrain `F` so that only function types are accepted:
   `HandlerResult<string>` must not compile.
5. **`IsNever<T>`** is `true` when `T` is `never` and `false` for every other type, unions
   included. Watch out: a bare `T extends never` distributes over `never`, the empty union.

Example:

```ts
asList("milk");                  // ["milk"], typed string[]
asList(["eggs", "milk"]);        // the same array, typed string[]

async function findProduct(code: string): Promise<{ code: string; name: string } | undefined> { ... }
type Found = HandlerResult<typeof findProduct>;  // { code: string; name: string } | undefined
type Slots = Resolved<Promise<Promise<string[]>>>; // string[]
type Yes = IsNever<never>;                         // true
type No = IsNever<string | number>;                // false
```
