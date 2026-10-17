import { BuildError, buildOrder, readProject } from "./solution.js";

// The example from the instructions.

const root = readProject(".", '{ "files": [], "references": [{ "path": "./apps/till" }, { "path": "./packages/shared" }] }');
check.equal(
  { folder: root.folder, composite: root.composite, references: root.references },
  { folder: ".", composite: false, references: ["apps/till", "packages/shared"] },
  "readProject reads the solution-style root config",
);

const till = readProject("apps/till", '{ "compilerOptions": { "composite": true }, "references": [{ "path": "../../packages/shared" }] }');
check.equal(
  { folder: till.folder, composite: till.composite, references: till.references },
  { folder: "apps/till", composite: true, references: ["packages/shared"] },
  "readProject resolves ../../packages/shared from apps/till",
);

const shared = readProject("packages/shared", '{ "compilerOptions": { "composite": true } }');
check.equal(buildOrder([root, till, shared]), ["packages/shared", "apps/till", "."], "the build order of the example");

const error = check.throws(() => buildOrder([till]), "a reference to a project that is not in the list is refused", BuildError) as BuildError;
check.equal(error.problem, "missing", "the problem of a reference to an unknown folder");
check.equal(error.projects, ["apps/till", "packages/shared"], "the folders named by the missing reference");
