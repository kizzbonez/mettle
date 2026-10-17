// Market Build Order
//
// Reads the tsconfig.json of each project in a monorepo and works out the order in which
// tsc -b builds them, refusing the reference mistakes tsc -b refuses.
import { posix } from "node:path";

/** One TypeScript project: its folder, from the repository root, and what it references. */
export interface Project {
  readonly folder: string;
  readonly composite: boolean;
  readonly references: readonly string[];
}

export type Problem = "missing" | "not-composite" | "cycle";

export class BuildError extends Error {
  readonly problem: Problem;
  readonly projects: readonly string[];
  constructor(problem: Problem, projects: readonly string[]) {
    super(`${problem}: ${projects.join(" -> ")}`);
    this.name = "BuildError";
    this.problem = problem;
    this.projects = projects;
  }
}

// Step 1: read one project's tsconfig.json. posix.join and posix.dirname are imported for you.
export function readProject(folder: string, tsconfigText: string): Project {
  throw new Error("Not implemented");
}

// Step 2: the folders in the order tsc -b builds them.
export function buildOrder(projects: readonly Project[]): string[] {
  throw new Error("Not implemented");
}
