import { resolveExport } from "./solution.js";

const TYPESCRIPT_ESM = ["types", "import", "node"];
const TYPESCRIPT_CJS = ["types", "require", "node"];
const NODE_ESM = ["node", "import"];
const NODE_CJS = ["node", "require"];

// Short forms for ".".
const single = JSON.stringify({ exports: "./dist/index.js" });
check.equal(resolveExport(single, ".", NODE_ESM), "./dist/index.js", "exports written as one string serves .");
check.equal(resolveExport(single, "./units", NODE_ESM), null, "exports written as one string serves nothing else");

const sugar = JSON.stringify({ exports: { types: "./dist/index.d.ts", default: "./dist/index.js" } });
check.equal(resolveExport(sugar, ".", TYPESCRIPT_ESM), "./dist/index.d.ts", "conditions without subpaths, for TypeScript");
check.equal(resolveExport(sugar, ".", NODE_CJS), "./dist/index.js", "conditions without subpaths, for Node.js");
check.equal(resolveExport(sugar, "./types", TYPESCRIPT_ESM), null, "a condition name is not a subpath");

// The package's order decides, not the caller's.
const dual = JSON.stringify({
  exports: { ".": { import: "./dist/index.js", require: "./dist/index.cjs", default: "./dist/index.js" } },
});
check.equal(resolveExport(dual, ".", ["require", "import"]), "./dist/index.js", "import comes first in the package, so it wins");
check.equal(resolveExport(dual, ".", NODE_CJS), "./dist/index.cjs", "require for a CommonJS consumer");
check.equal(resolveExport(dual, ".", []), "./dist/index.js", "default matches with no conditions at all");
check.equal(resolveExport(dual, ".", ["browser"]), "./dist/index.js", "an unknown condition falls through to default");

// Nested conditions, and falling through when a branch leads nowhere.
const nested = JSON.stringify({
  exports: {
    "./units": {
      import: { types: "./dist/units.d.ts", browser: "./dist/units.browser.js" },
      require: { types: "./dist/units.d.cts", default: "./dist/units.cjs" },
      default: "./dist/units.js",
    },
    "./internal": null,
    "./package.json": "./package.json",
  },
});
check.equal(resolveExport(nested, "./units", TYPESCRIPT_ESM), "./dist/units.d.ts", "types inside import");
check.equal(resolveExport(nested, "./units", TYPESCRIPT_CJS), "./dist/units.d.cts", "types inside require");
check.equal(resolveExport(nested, "./units", ["browser", "import"]), "./dist/units.browser.js", "browser inside import");
check.equal(resolveExport(nested, "./units", NODE_ESM), "./dist/units.js", "import leads nowhere for Node.js, so default wins");
check.equal(resolveExport(nested, "./units", NODE_CJS), "./dist/units.cjs", "default inside require");
check.equal(resolveExport(nested, "./internal", NODE_ESM), null, "a subpath mapped to null is blocked");
check.equal(resolveExport(nested, "./package.json", NODE_ESM), "./package.json", "package.json exported as itself");
check.equal(resolveExport(nested, ".", NODE_ESM), null, "a package without . cannot be imported by its name");
check.equal(resolveExport(nested, "./dist/units.js", NODE_ESM), null, "a file path is not a subpath");

// Nothing matches.
const typesOnly = JSON.stringify({ exports: { ".": { types: "./dist/index.d.ts" } } });
check.equal(resolveExport(typesOnly, ".", NODE_ESM), null, "Node.js never uses the types condition");
check.equal(resolveExport(typesOnly, ".", TYPESCRIPT_ESM), "./dist/index.d.ts", "TypeScript does");
