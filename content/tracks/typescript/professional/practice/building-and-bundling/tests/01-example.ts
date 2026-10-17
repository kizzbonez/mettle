import { emittedFiles, rewriteImport } from "./solution.js";

// The example from the instructions.

check.equal(rewriteImport("./prices.ts"), "./prices.js", "a relative .ts import becomes .js");
check.equal(rewriteImport("../shared/vat.mts"), "../shared/vat.mjs", "a relative .mts import becomes .mjs");
check.equal(rewriteImport("./types.d.ts"), "./types.d.ts", "a declaration file import is left alone");
check.equal(rewriteImport("node:fs"), "node:fs", "a built-in module is left alone");

const options = { rootDir: "src", outDir: "dist", declaration: true, sourceMap: true };
check.equal(
  emittedFiles("src/orders/bouquet.ts", options),
  ["dist/orders/bouquet.js", "dist/orders/bouquet.js.map", "dist/orders/bouquet.d.ts"],
  "a .ts file with declaration and sourceMap",
);
check.equal(
  emittedFiles("src/legacy.cts", { ...options, declarationMap: true }),
  ["dist/legacy.cjs", "dist/legacy.cjs.map", "dist/legacy.d.cts", "dist/legacy.d.cts.map"],
  "a .cts file with declaration maps as well",
);
check.equal(emittedFiles("src/globals.d.ts", options), [], "a declaration file emits nothing");
check.throws(() => emittedFiles("scripts/seed.ts", options), "a file outside rootDir is refused", RangeError);
