import { checkPackage, type Problem } from "./solution.js";

function sorted(problems: readonly Problem[]): Problem[] {
  return problems.toSorted((a, b) => (a.rule + " " + a.where).localeCompare(b.rule + " " + b.where));
}

const EXPORTS = {
  ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
  "./package.json": "./package.json",
};

function problems(files: unknown, exportsField: unknown = EXPORTS): Problem[] {
  const pkg: Record<string, unknown> = { name: "yarn-calc", exports: exportsField };
  if (files !== undefined) pkg["files"] = files;
  return sorted(checkPackage(JSON.stringify(pkg)));
}

// files itself.
check.equal(problems(undefined), [{ rule: "no-files", where: "files" }], "a package without files");
check.equal(problems([]), [{ rule: "no-files", where: "files" }], "an empty files list");
check.equal(problems("dist"), [{ rule: "no-files", where: "files" }], "files written as a string");
check.equal(problems(["dist", 3]), [{ rule: "no-files", where: "files" }], "files with an entry that is not a string");

// The ways of writing a folder.
for (const files of [["dist"], ["dist/"], ["./dist"], ["./dist/"], ["README.md", "dist"]]) {
  check.equal(problems(files), [], `files ${JSON.stringify(files)} contains ./dist/index.js`);
}

// Single files and folders that only look alike.
check.equal(
  problems(["dist/index.js", "dist/index.d.ts"]),
  [],
  "files that name each exported file",
);
check.equal(
  problems(["dist/index.js"]),
  [{ rule: "outside-files", where: "./dist/index.d.ts" }],
  "the declarations left out of files",
);
check.equal(
  problems(["distribution"]),
  sorted([
    { rule: "outside-files", where: "./dist/index.d.ts" },
    { rule: "outside-files", where: "./dist/index.js" },
  ]),
  "a folder whose name only starts like dist",
);
check.equal(
  problems(["dist"], { ".": "./distribution/index.js" }),
  [{ rule: "outside-files", where: "./distribution/index.js" }],
  "a path in a folder whose name only starts like an entry of files",
);
check.equal(
  problems(["lib"]),
  sorted([
    { rule: "outside-files", where: "./dist/index.d.ts" },
    { rule: "outside-files", where: "./dist/index.js" },
  ]),
  "files that miss the whole dist folder, but package.json is always included",
);

// Nested targets and other subpaths.
check.equal(
  problems(["dist"], {
    ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
    "./units": { import: { types: "./dist/units.d.ts", default: "./src/units.js" }, require: "./build/units.cjs" },
    "./internal": null,
  }),
  sorted([
    { rule: "outside-files", where: "./src/units.js" },
    { rule: "outside-files", where: "./build/units.cjs" },
  ]),
  "every nested path is checked, and null is not a path",
);

// No files: the folder rule cannot be checked, the other rules still are.
check.equal(
  problems(undefined, { ".": { default: "./dist/index.js", types: "./dist/index.ts" } }),
  sorted([
    { rule: "no-files", where: "files" },
    { rule: "types-not-first", where: "." },
    { rule: "types-not-declaration", where: "./dist/index.ts" },
  ]),
  "without files, only the exports rules apply",
);
