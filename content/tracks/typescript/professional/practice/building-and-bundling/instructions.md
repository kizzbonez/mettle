Paths are written with forward slashes, relative to the project folder (`src/orders/bouquet.ts`).
Keep `EmitOptions` as it is; an option that is left out is off. The tests compare your answers
with what `tsc` writes for many sources and settings.

1. **`rewriteImport(specifier: string): string`** returns the import path that ends up in the
   emitted JavaScript when `rewriteRelativeImportExtensions` is on:
   - only **relative** specifiers, starting with `./` or `../`, are rewritten;
   - `.ts` becomes `.js`, `.mts` becomes `.mjs`, `.cts` becomes `.cjs`;
   - a declaration file (`.d.ts`, `.d.mts`, `.d.cts`) is left alone, and so is everything else:
     `"./fare.js"`, `"node:fs"`, `"some-package/file.ts"`.
2. **`emittedFiles(source: string, options: EmitOptions): string[]`** returns the files `tsc`
   writes for one source file, which ends in `.ts`, `.mts` or `.cts`, or is a declaration file:
   - A declaration file emits nothing, wherever it is, and with `noEmit` (type-checking only)
     nothing is written: return `[]`.
   - A source that is not inside `rootDir` is error TS6059: throw a `RangeError`. Use
     `posix.relative(rootDir, source)`: a result starting with `../` means outside.
   - Each output keeps the source's path inside `rootDir`, placed under `outDir`
     (`posix.join`), with the extension changed: `.ts` gives `.js` and `.d.ts`, `.mts` gives
     `.mjs` and `.d.mts`, `.cts` gives `.cjs` and `.d.cts`.
   - Return them in this order: the JavaScript file and, with `sourceMap`, its map (the
     JavaScript name plus `.map`), both left out with `emitDeclarationOnly`; then, with
     `declaration`, the declaration file and, with `declarationMap`, its map (the declaration
     name plus `.map`).

Example:

```ts
rewriteImport("./prices.ts")          // "./prices.js"
rewriteImport("../shared/vat.mts")    // "../shared/vat.mjs"
rewriteImport("./types.d.ts")         // "./types.d.ts"
rewriteImport("node:fs")              // "node:fs"

const options = { rootDir: "src", outDir: "dist", declaration: true, sourceMap: true };
emittedFiles("src/orders/bouquet.ts", options)
// ["dist/orders/bouquet.js", "dist/orders/bouquet.js.map", "dist/orders/bouquet.d.ts"]
emittedFiles("src/legacy.cts", { ...options, declarationMap: true })
// ["dist/legacy.cjs", "dist/legacy.cjs.map", "dist/legacy.d.cts", "dist/legacy.d.cts.map"]
emittedFiles("src/globals.d.ts", options)   // []
emittedFiles("scripts/seed.ts", options)    // throws a RangeError: not under rootDir
```

**Tip:** check `.d.ts` before `.ts`, since every declaration file also ends in `.ts`. A small
table of the three extensions and what each becomes serves both functions.
