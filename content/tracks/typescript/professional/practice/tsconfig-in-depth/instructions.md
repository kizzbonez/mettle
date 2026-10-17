Both functions receive the **text** of a `tsconfig.json` (plain JSON, without comments) and read
its `compilerOptions`. Parse it with `JSON.parse` and treat the result as `unknown`: a
`SyntaxError` for broken JSON may simply propagate, but throw a `TypeError` when the file is not
a JSON object (an array, a string, `null`) or when `compilerOptions` is present but not an
object. A file without `compilerOptions` sets nothing. The tests call your functions with many
configurations and compare the answers, and one test checks your `Flag` type.

1. **`Flag`**: replace the placeholder with the exact union of `"strict"`, every name in
   `STRICT_FAMILY` and every name in `OTHER_FLAGS`, derived from the two `as const` arrays.
   `isEnabled(text, "strictNull")` must then be a compile error.
2. **`removedOptions(text: string): string[]`** returns the names of the options TypeScript 7
   refuses, in the order they appear in `compilerOptions`. String values are compared without
   regard to case, because `tsconfig.json` accepts `"ES5"` as well as `"es5"`:
   - `target` set to `"es5"`;
   - `module` set to `"amd"`, `"umd"` or `"system"`;
   - `moduleResolution` set to `"node"`, `"node10"` or `"classic"`;
   - `baseUrl`, `outFile` and `downlevelIteration`, whatever their value;
   - `esModuleInterop`, `allowSyntheticDefaultImports` and `alwaysStrict` set to `false`.
3. **`isEnabled(text: string, flag: Flag): boolean`** says whether the check is on. A flag set
   to `true` or `false` in `compilerOptions` is that value. Otherwise:
   - `strict` is `true`, the default since TypeScript 6;
   - a member of the strict family follows `strict`, whether `strict` was set or defaulted;
   - `isolatedModules` follows `verbatimModuleSyntax`, which implies it;
   - every other flag is `false`.

   A value that is not a boolean counts as not set.

Example:

```ts
const legacy = `{
  "compilerOptions": {
    "target": "ES5",
    "strict": false,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outFile": "bundle.js"
  }
}`;
removedOptions(legacy)                       // ["target", "moduleResolution", "outFile"]
isEnabled(legacy, "strict")                  // false
isEnabled(legacy, "strictNullChecks")        // true: set on its own
isEnabled(legacy, "noImplicitAny")           // false: follows strict
isEnabled("{}", "strict")                    // true: the default
isEnabled("{}", "noUncheckedIndexedAccess")  // false: not in the strict family
isEnabled('{ "compilerOptions": { "verbatimModuleSyntax": true } }', "isolatedModules")  // true
removedOptions("[]")                         // throws a TypeError
```

**Tip:** `(typeof STRICT_FAMILY)[number]` is the union of the strings in the array. Write one
small helper that parses the text and returns the `compilerOptions` object, and use it in both
functions.
