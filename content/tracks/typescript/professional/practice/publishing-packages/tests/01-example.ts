import { checkPackage, resolveExport, type Problem } from "./solution.js";

// The example from the instructions.

function sorted(problems: readonly Problem[]): Problem[] {
  return problems.toSorted((a, b) => (a.rule + " " + a.where).localeCompare(b.rule + " " + b.where));
}

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
check.equal(resolveExport(good, ".", ["types", "import", "node"]), "./dist/index.d.ts", "what TypeScript reads for the package name");
check.equal(resolveExport(good, ".", ["node", "import"]), "./dist/index.js", "what Node.js loads for the package name");
check.equal(resolveExport(good, "./units", ["node", "require"]), "./dist/units.cjs", "what require loads for yarn-calc/units");
check.equal(resolveExport(good, "./dist/index.js", ["node", "import"]), null, "a subpath that is not exported");
check.equal(checkPackage(good), [], "the good package has no problems");

const broken = '{ "exports": { "default": "./dist/index.js", "types": "./src/index.ts" }, "files": ["dist"] }';
check.equal(resolveExport(broken, ".", ["types", "import"]), "./dist/index.js", "default listed before types wins, even for TypeScript");
check.equal(
  sorted(checkPackage(broken)),
  sorted([
    { rule: "types-not-first", where: "." },
    { rule: "types-not-declaration", where: "./src/index.ts" },
    { rule: "outside-files", where: "./src/index.ts" },
  ]),
  "the three problems of the broken package",
);
