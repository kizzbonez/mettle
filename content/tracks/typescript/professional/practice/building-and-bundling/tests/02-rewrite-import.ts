import { rewriteImport } from "./solution.js";

const cases: [string, string, string][] = [
  // Relative TypeScript files are rewritten.
  ["./fare.ts", "./fare.js", "a .ts file in the same folder"],
  ["../../lib/stock.ts", "../../lib/stock.js", "a .ts file two folders up"],
  ["./orders/wreath.mts", "./orders/wreath.mjs", "a .mts file in a subfolder"],
  ["../legacy/till.cts", "../legacy/till.cjs", "a .cts file one folder up"],
  ["./data.json.ts", "./data.json.js", "only the last extension counts"],
  ["./ts.ts", "./ts.js", "a file named ts"],
  // Declaration files are never rewritten.
  ["./types.d.ts", "./types.d.ts", "a .d.ts import"],
  ["../shared/api.d.mts", "../shared/api.d.mts", "a .d.mts import"],
  ["./old.d.cts", "./old.d.cts", "a .d.cts import"],
  // Files that are already JavaScript, or not files of the project.
  ["./fare.js", "./fare.js", "a .js import"],
  ["./fare.mjs", "./fare.mjs", "a .mjs import"],
  ["./prices.json", "./prices.json", "a JSON import"],
  ["./fonts.tsx.css", "./fonts.tsx.css", "an extension that only contains ts"],
  ["./parts", "./parts", "an import without an extension"],
  ["./carts", "./carts", "a name that ends in ts without a dot"],
  ["./import.mts.bak", "./import.mts.bak", "an extension that only starts with mts"],
  // Bare specifiers are package names, not relative paths.
  ["node:fs/promises", "node:fs/promises", "a built-in module"],
  ["florist-kit", "florist-kit", "a package"],
  ["florist-kit/src/index.ts", "florist-kit/src/index.ts", "a .ts path inside a package"],
  ["#/stock.ts", "#/stock.ts", "a subpath import"],
  [".ts", ".ts", "a name that is only an extension"],
];

for (const [written, emitted, what] of cases) {
  check.equal(rewriteImport(written), emitted, what);
}
