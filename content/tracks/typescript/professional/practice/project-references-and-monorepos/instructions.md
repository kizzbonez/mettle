A project is described by its folder, written from the repository root (`"packages/payments"`,
or `"."` for the root), whether its config sets `composite: true`, and the folders it
references. Keep `Project`, `Problem` and `BuildError` as they are. The tests read projects with
your `readProject` and compare the orders and errors of `buildOrder` with what `tsc -b` would do.

1. **`readProject(folder: string, tsconfigText: string): Project`** parses the text (a valid
   `tsconfig.json` without comments; treat what `JSON.parse` returns as `unknown`):
   - `composite` is `true` only when `compilerOptions.composite` is exactly `true`.
   - Each entry of `references` is `{ "path": "..." }`, relative to the project's folder. Resolve
     it with `posix.join(folder, path)`, so `"../shared"` in `packages/payments` becomes
     `"packages/shared"` and `"./apps/till"` in `"."` becomes `"apps/till"`. A path that ends in
     `.json` names a config file: use the folder that holds it (`posix.dirname`). Keep the
     references in the order listed; no `references` means none.
2. **`buildOrder(projects: readonly Project[]): string[]`** returns every folder once, each after
   all the projects it references, by a depth-first walk: take the projects in the order given;
   to visit a project, first visit each project it references that is not built yet, in the
   order listed, then add the project itself. Before following a reference, check it and throw a
   `BuildError` for the first problem found:
   - `"missing"`, with `projects` `[referencing folder, referenced folder]`, when no project has
     that folder;
   - `"not-composite"`, with the same two folders, when the referenced project is not composite
     (tsc reports this as error TS6306);
   - `"cycle"`, when the referenced project is already being visited: `projects` lists the
     cycle from that project round to itself again, such as `["a", "b", "c", "a"]`.

Example:

```ts
const root = readProject(".", '{ "files": [], "references": [{ "path": "./apps/till" }, { "path": "./packages/shared" }] }');
// { folder: ".", composite: false, references: ["apps/till", "packages/shared"] }
const till = readProject("apps/till", '{ "compilerOptions": { "composite": true }, "references": [{ "path": "../../packages/shared" }] }');
// { folder: "apps/till", composite: true, references: ["packages/shared"] }
const shared = readProject("packages/shared", '{ "compilerOptions": { "composite": true } }');

buildOrder([root, till, shared])   // ["packages/shared", "apps/till", "."]
buildOrder([till])                 // throws BuildError: problem "missing", projects ["apps/till", "packages/shared"]
```

The root is not composite, and that is fine: only a project that something references needs
`composite`.

**Tip:** keep a set of the folders already built and a list of the folders being visited right
now. A reference to a folder in that list is a cycle; a reference to a built one needs no visit.
