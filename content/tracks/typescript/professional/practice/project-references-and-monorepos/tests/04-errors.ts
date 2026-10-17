import { BuildError, buildOrder, type Problem, type Project } from "./solution.js";

function project(folder: string, references: string[], composite = true): Project {
  return { folder, composite, references };
}

function refused(projects: readonly Project[], what: string): { problem: Problem; projects: readonly string[] } {
  const error = check.throws(() => buildOrder(projects), what, BuildError) as BuildError;
  return { problem: error.problem, projects: error.projects };
}

// A missing project, found while walking from the root.
check.equal(
  refused([project(".", ["apps/till"], false), project("apps/till", ["packages/shared", "packages/payments"]), project("packages/shared", [])], "a missing project is refused"),
  { problem: "missing", projects: ["apps/till", "packages/payments"] },
  "the missing project and the project that references it",
);

// A referenced project that is not composite (TS6306).
check.equal(
  refused([project("apps/till", ["packages/shared"]), project("packages/shared", [], false)], "a reference to a project that is not composite is refused"),
  { problem: "not-composite", projects: ["apps/till", "packages/shared"] },
  "the project that is not composite and the project that references it",
);

// Cycles.
check.equal(
  refused([project("packages/money", ["packages/money"])], "a project that references itself is refused"),
  { problem: "cycle", projects: ["packages/money", "packages/money"] },
  "a project that references itself",
);
check.equal(
  refused(
    [project(".", ["packages/x"], false), project("packages/x", ["packages/y"]), project("packages/y", ["packages/z"]), project("packages/z", ["packages/x"])],
    "a cycle of three projects is refused",
  ),
  { problem: "cycle", projects: ["packages/x", "packages/y", "packages/z", "packages/x"] },
  "the cycle starts and ends at the repeated project, without the root that led to it",
);
check.equal(
  refused([project("packages/shared", []), project("packages/a", ["packages/shared", "packages/b"]), project("packages/b", ["packages/shared", "packages/a"])], "a cycle after a shared project is refused"),
  { problem: "cycle", projects: ["packages/a", "packages/b", "packages/a"] },
  "a cycle between two projects that also share a dependency",
);

// The checks run in order for each reference: missing, then composite, then cycle.
check.equal(
  refused([project("packages/a", ["packages/b"], false), project("packages/b", ["packages/a"])], "a cycle through a project that is not composite is refused"),
  { problem: "not-composite", projects: ["packages/b", "packages/a"] },
  "a reference that is both in a cycle and not composite reports not-composite",
);

// A diamond is not a cycle.
check.equal(
  buildOrder([project("d", ["b", "c"]), project("b", ["a"]), project("c", ["a"]), project("a", [])]),
  ["a", "b", "c", "d"],
  "two projects that share a dependency are not a cycle",
);
