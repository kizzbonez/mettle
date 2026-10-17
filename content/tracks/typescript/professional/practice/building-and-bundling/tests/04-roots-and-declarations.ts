import { emittedFiles } from "./solution.js";

const all = { declaration: true, declarationMap: true, sourceMap: true };

// Other rootDir and outDir values.
check.equal(
  emittedFiles("src/main.ts", { ...all, rootDir: ".", outDir: "build" }),
  ["build/src/main.js", "build/src/main.js.map", "build/src/main.d.ts", "build/src/main.d.ts.map"],
  "rootDir . keeps the src folder under outDir",
);
check.equal(
  emittedFiles("packages/stock/src/count.ts", { rootDir: "packages/stock/src", outDir: "packages/stock/dist" }),
  ["packages/stock/dist/count.js"],
  "a package inside a monorepo",
);
check.equal(emittedFiles("src/main.ts", { rootDir: "./src", outDir: "./out" }), ["out/main.js"], "paths written with ./");

// Sources outside rootDir (TS6059).
const options = { ...all, rootDir: "src", outDir: "dist" };
for (const source of ["test/main.test.ts", "../elsewhere/main.ts", "src/../scripts/seed.ts", "srcs/main.ts", "main.ts"]) {
  check.throws(() => emittedFiles(source, options), `${source} is not under rootDir src`, RangeError);
}
check.throws(() => emittedFiles("src/main.ts", { rootDir: "src/orders", outDir: "dist" }), "a file above rootDir", RangeError);

// Declaration files emit nothing, wherever they are.
for (const source of ["src/globals.d.ts", "src/api.d.mts", "src/legacy.d.cts", "types/env.d.ts"]) {
  check.equal(emittedFiles(source, options), [], `${source} emits nothing`);
}
