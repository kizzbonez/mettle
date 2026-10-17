import { emittedFiles } from "./solution.js";

const root = { rootDir: "src", outDir: "dist" };

check.equal(emittedFiles("src/main.ts", root), ["dist/main.js"], "only the JavaScript file by default");
check.equal(emittedFiles("src/main.ts", { ...root, sourceMap: true }), ["dist/main.js", "dist/main.js.map"], "sourceMap adds the map after the JavaScript");
check.equal(emittedFiles("src/main.ts", { ...root, declaration: true }), ["dist/main.js", "dist/main.d.ts"], "declaration adds the declaration file");
check.equal(
  emittedFiles("src/main.ts", { ...root, declaration: true, declarationMap: true, sourceMap: true }),
  ["dist/main.js", "dist/main.js.map", "dist/main.d.ts", "dist/main.d.ts.map"],
  "all four files in order",
);
check.equal(
  emittedFiles("src/main.ts", { ...root, declaration: true, declarationMap: true, sourceMap: false }),
  ["dist/main.js", "dist/main.d.ts", "dist/main.d.ts.map"],
  "a declaration map without a JavaScript map",
);

// The three module extensions.
const all = { ...root, declaration: true, declarationMap: true, sourceMap: true };
check.equal(
  emittedFiles("src/worker.mts", all),
  ["dist/worker.mjs", "dist/worker.mjs.map", "dist/worker.d.mts", "dist/worker.d.mts.map"],
  "a .mts file",
);
check.equal(
  emittedFiles("src/report.cts", all),
  ["dist/report.cjs", "dist/report.cjs.map", "dist/report.d.cts", "dist/report.d.cts.map"],
  "a .cts file",
);

// Folders inside rootDir are kept.
check.equal(
  emittedFiles("src/orders/seasonal/wreath.ts", { ...root, sourceMap: true }),
  ["dist/orders/seasonal/wreath.js", "dist/orders/seasonal/wreath.js.map"],
  "a file two folders inside rootDir",
);

// Only declarations: another tool writes the JavaScript.
check.equal(
  emittedFiles("src/index.ts", { ...root, declaration: true, emitDeclarationOnly: true, sourceMap: true }),
  ["dist/index.d.ts"],
  "emitDeclarationOnly leaves out the JavaScript and its map",
);
check.equal(
  emittedFiles("src/index.mts", { ...root, declaration: true, declarationMap: true, emitDeclarationOnly: true }),
  ["dist/index.d.mts", "dist/index.d.mts.map"],
  "emitDeclarationOnly keeps the declaration map",
);

// Only checking.
check.equal(emittedFiles("src/main.ts", { ...all, noEmit: true }), [], "noEmit writes nothing");
check.equal(emittedFiles("src/main.ts", { ...all, noEmit: false }), emittedFiles("src/main.ts", all), "noEmit: false is the same as leaving it out");
