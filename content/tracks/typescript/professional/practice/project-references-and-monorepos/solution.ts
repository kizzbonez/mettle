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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readProject(folder: string, tsconfigText: string): Project {
  const config: unknown = JSON.parse(tsconfigText);
  if (!isObject(config)) throw new TypeError(`${folder}: tsconfig.json is not an object`);

  const options = config["compilerOptions"];
  const composite = isObject(options) && options["composite"] === true;

  const references: string[] = [];
  const listed = config["references"];
  if (Array.isArray(listed)) {
    for (const entry of listed) {
      if (!isObject(entry) || typeof entry["path"] !== "string") continue;
      const target = posix.join(folder, entry["path"]);
      // A path ending in .json names a config file; the project is the folder holding it.
      references.push(target.endsWith(".json") ? posix.dirname(target) : target);
    }
  }
  return { folder, composite, references };
}

export function buildOrder(projects: readonly Project[]): string[] {
  const byFolder = new Map(projects.map((project) => [project.folder, project]));
  const order: string[] = [];
  const built = new Set<string>();
  const path: string[] = []; // the projects being visited, from the outermost

  function visit(project: Project): void {
    path.push(project.folder);
    for (const folder of project.references) {
      const target = byFolder.get(folder);
      if (target === undefined) throw new BuildError("missing", [project.folder, folder]);
      if (!target.composite) throw new BuildError("not-composite", [project.folder, folder]);
      if (path.includes(folder)) throw new BuildError("cycle", [...path.slice(path.indexOf(folder)), folder]);
      if (!built.has(folder)) visit(target);
    }
    path.pop();
    built.add(project.folder);
    order.push(project.folder);
  }

  for (const project of projects) {
    if (!built.has(project.folder)) visit(project);
  }
  return order;
}
