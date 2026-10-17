import { readProject } from "./solution.js";

function plain(folder: string, text: string): { folder: string; composite: boolean; references: readonly string[] } {
  const project = readProject(folder, text);
  return { folder: project.folder, composite: project.composite, references: project.references };
}

check.equal(
  plain("packages/payments", JSON.stringify({
    extends: "../../tsconfig.base.json",
    compilerOptions: { composite: true, rootDir: "src", outDir: "dist" },
    include: ["src"],
    references: [{ path: "../shared" }, { path: "../money" }],
  })),
  { folder: "packages/payments", composite: true, references: ["packages/shared", "packages/money"] },
  "a package config with two sibling references, in the order listed",
);

check.equal(
  plain("packages/payments", '{ "compilerOptions": { "composite": true }, "references": [{ "path": "../shared/tsconfig.json" }, { "path": "../../tools/rates/tsconfig.build.json" }] }').references,
  ["packages/shared", "tools/rates"],
  "references that name a config file resolve to the folder holding it",
);

check.equal(
  plain(".", '{ "files": [], "references": [{ "path": "packages/shared" }, { "path": "./apps/stalls" }] }').references,
  ["packages/shared", "apps/stalls"],
  "references from the root, with and without ./",
);

check.equal(
  plain("apps/till/web", '{ "references": [{ "path": "../../../packages/shared" }, { "path": "../api" }] }').references,
  ["packages/shared", "apps/till/api"],
  "references from a folder three levels down",
);

check.equal(plain("packages/shared", '{ "compilerOptions": { "composite": true } }').references, [], "a config without references references nothing");
check.equal(plain("packages/shared", '{ "references": [] }').references, [], "an empty references list");

check.equal(plain("packages/shared", '{ "compilerOptions": { "composite": true } }').composite, true, "composite: true");
check.equal(plain("packages/shared", '{ "compilerOptions": { "composite": false } }').composite, false, "composite: false");
check.equal(plain("packages/shared", '{ "compilerOptions": { "composite": "true" } }').composite, false, "composite written as a string is not true");
check.equal(plain("packages/shared", '{ "compilerOptions": { "declaration": true } }').composite, false, "a config that does not mention composite");
check.equal(plain("packages/shared", '{ "include": ["src"] }').composite, false, "a config without compilerOptions");
check.equal(plain("tools/rates", "{}").folder, "tools/rates", "the folder is kept as given");
