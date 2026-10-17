`data/metronome.mjs` is a JavaScript module with JSDoc comments and no TypeScript types. The
starter loads it as `any` and gives it the type `MetronomeModule`, which is empty so far. Write
the declarations the way a `.d.ts` file would: signatures only, no bodies. Because the lab
compiles only `solution.ts`, they go in interfaces instead of a `declare module` block: each
function the module exports becomes a method signature, and its exported `const` a `readonly`
property. JSDoc types are TypeScript syntax in braces, so `{Pattern | undefined}` means
`Pattern | undefined`.

Most tests check your **types**: lines the compiler must reject are marked `// @ts-expect-error`,
so a declaration that is too loose (an `any`, a missing `undefined`, a missing `readonly`) fails a
test.

1. **`Pattern`**: the `@typedef` in the module, with its three properties.
2. **`RenderSymbols`**: the type of `render`'s second parameter, with both properties optional.
3. **`MetronomeModule`**: the module's four exports, `VERSION`, `beatInterval`, `patternFor` and
   `render`, with the parameter and return types their JSDoc gives. `render`'s second parameter
   is optional (it is written `[symbols]`), and `patternFor` may return `undefined`.
4. **`barDisplay(name: string, bpm: number): string`** uses `metronome` to describe one bar:
   `<name> at <bpm> bpm: <the bar drawn by render, default symbols> (<beat interval in ms,
   rounded with Math.round> ms)`. For a name with no pattern it throws an `Error` whose message
   is `unknown pattern: <name>`. A tempo the module refuses throws the module's own `RangeError`.

Example:

```ts
metronome.VERSION                                  // "2.3.0"
metronome.beatInterval(120)                        // 500
const waltz = metronome.patternFor("waltz");       // a Pattern | undefined
if (waltz !== undefined) {
  waltz.accents                                    // [true, false, false]
  metronome.render(waltz, { accent: "O", beat: "." })   // "O . ."
}
barDisplay("waltz", 90)                            // "waltz at 90 bpm: X x x (667 ms)"
metronome.beatInterval("120")                      // compile error: bpm is a number
```
