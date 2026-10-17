import { checkPackage, type Problem } from "./solution.js";

function sorted(problems: readonly Problem[]): Problem[] {
  return problems.toSorted((a, b) => (a.rule + " " + a.where).localeCompare(b.rule + " " + b.where));
}

function problems(exportsField: unknown): Problem[] {
  return sorted(checkPackage(JSON.stringify({ name: "yarn-calc", exports: exportsField, files: ["dist"] })));
}

check.equal(problems({ ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } }), [], "types first");
check.equal(
  problems({ ".": { import: "./dist/index.js", types: "./dist/index.d.ts" } }),
  [{ rule: "types-not-first", where: "." }],
  "types after import",
);
check.equal(
  problems({ types: "./dist/index.d.ts", default: "./dist/index.js" }),
  [],
  "the short form with types first",
);
check.equal(
  problems({ node: "./dist/node.js", default: "./dist/index.js", types: "./dist/index.d.ts" }),
  [{ rule: "types-not-first", where: "." }],
  "the short form with types last",
);

// At any depth, named by the subpath.
check.equal(
  problems({
    "./units": {
      import: { default: "./dist/units.js", types: "./dist/units.d.ts" },
      require: { types: "./dist/units.d.cts", default: "./dist/units.cjs" },
    },
  }),
  [{ rule: "types-not-first", where: "./units" }],
  "types last inside import, first inside require",
);
check.equal(
  problems({
    ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
    "./units": { import: { default: "./dist/units.js", types: "./dist/units.d.ts" }, types: "./dist/units.d.ts" },
  }),
  sorted([
    { rule: "types-not-first", where: "./units" },
    { rule: "types-not-first", where: "./units" },
  ]),
  "two conditions objects under one subpath, each with types out of place",
);
check.equal(problems({ ".": { import: "./dist/index.js", default: "./dist/index.js" } }), [], "no types at all is not this rule");

// What a types path must be.
for (const path of ["./dist/index.d.ts", "./dist/index.d.mts", "./dist/index.d.cts"]) {
  check.equal(problems({ ".": { types: path, default: "./dist/index.js" } }), [], `a types path ending in ${path.slice(path.indexOf(".d."))}`);
}
for (const path of ["./dist/index.ts", "./dist/index.js", "./dist/index.d.json", "./dist/types"]) {
  check.equal(
    problems({ ".": { types: path, default: "./dist/index.js" } }),
    [{ rule: "types-not-declaration", where: path }],
    `a types path ${path}`,
  );
}
check.equal(
  problems({ "./units": { require: { types: "./dist/units.cts", default: "./dist/units.cjs" } } }),
  [{ rule: "types-not-declaration", where: "./dist/units.cts" }],
  "a types path nested inside require",
);
check.equal(problems({ ".": { default: "./dist/index.d.ts" } }), [], "only paths under types must be declarations");
