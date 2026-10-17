Both functions receive the **text** of a `package.json`; parse it with `JSON.parse` and treat the
result as `unknown`. Keep `Rule` and `Problem` as they are. The tests compare the files you
resolve with what Node.js and TypeScript load, and the problems you report with the rules below.

**Reading `exports`.** It maps each public subpath (`"."` is the package name itself,
`"./units"` is `yarn-calc/units`) to a target. Two short forms describe `"."` alone: a string,
and an object whose keys do not start with `.` (conditions). A target is a file path (a
string), `null` (blocked), or an object of **conditions** whose values are targets again.

1. **`resolveExport(packageJson: string, subpath: string, conditions: readonly string[]): string | null`**
   returns the file the package serves, or `null` when the subpath is not exported (Node's
   `ERR_PACKAGE_PATH_NOT_EXPORTED`) or no condition leads to a file. In a conditions object,
   go through the keys **in the package's order**: a key matches when it is `"default"` or in
   `conditions`; resolve its value, and if that gives a file, it wins; otherwise carry on with
   the next key. The caller's order of `conditions` does not matter.
2. **`checkPackage(packageJson: string): Problem[]`** returns every problem, in any order (the
   tests sort them):
   - `{ rule: "no-files", where: "files" }` when `files` is missing, empty, or not an array of
     strings.
   - `{ rule: "types-not-first", where: subpath }` for each conditions object, at any depth,
     that has a `"types"` key that is not its first key.
   - `{ rule: "types-not-declaration", where: path }` for each path under a `"types"` key that
     does not end in `.d.ts`, `.d.mts` or `.d.cts`.
   - `{ rule: "outside-files", where: path }` for each path in `exports` that the tarball will
     not contain: it is not an entry of `files` and not inside a folder that is. Compare with
     `posix.normalize`, so `"./dist/index.js"` is inside `"dist"`, `"dist/"` and `"./dist"`.
     `"./package.json"` is always in the tarball. Skip this rule when `files` is not usable.

Example:

```ts
const good = JSON.stringify({
  name: "yarn-calc",
  type: "module",
  exports: {
    ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
    "./units": { import: { types: "./dist/units.d.ts", default: "./dist/units.js" }, require: "./dist/units.cjs" },
    "./package.json": "./package.json",
  },
  files: ["dist"],
});
resolveExport(good, ".", ["types", "import", "node"])   // "./dist/index.d.ts": what TypeScript reads
resolveExport(good, ".", ["node", "import"])            // "./dist/index.js": what Node.js loads
resolveExport(good, "./units", ["node", "require"])     // "./dist/units.cjs"
resolveExport(good, "./dist/index.js", ["node", "import"])  // null: not exported
checkPackage(good)                                      // []

const broken = '{ "exports": { "default": "./dist/index.js", "types": "./src/index.ts" }, "files": ["dist"] }';
resolveExport(broken, ".", ["types", "import"])         // "./dist/index.js": default came first
checkPackage(broken)
// [{ rule: "types-not-first", where: "." },
//  { rule: "types-not-declaration", where: "./src/index.ts" },
//  { rule: "outside-files", where: "./src/index.ts" }]
```

**Tip:** turn `exports` into one `Map` from subpath to target first; both functions need it.
A recursive function then handles conditions at any depth.
