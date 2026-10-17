// Florist Build Plan
//
// Predicts what tsc writes for each source file, and how it rewrites relative imports
// under rewriteRelativeImportExtensions.
import { posix } from "node:path";

/** The emit settings of a tsconfig.json that matter here. Paths are relative to the project folder. */
export interface EmitOptions {
  readonly rootDir: string;
  readonly outDir: string;
  readonly declaration?: boolean;
  readonly declarationMap?: boolean;
  readonly sourceMap?: boolean;
  readonly emitDeclarationOnly?: boolean;
  readonly noEmit?: boolean;
}

const DECLARATION_FILES = [".d.ts", ".d.mts", ".d.cts"];

// Each TypeScript extension, with the JavaScript and declaration extensions it becomes.
const EXTENSIONS = [
  { source: ".ts", js: ".js", declaration: ".d.ts" },
  { source: ".mts", js: ".mjs", declaration: ".d.mts" },
  { source: ".cts", js: ".cjs", declaration: ".d.cts" },
] as const;

function isDeclarationFile(path: string): boolean {
  return DECLARATION_FILES.some((extension) => path.endsWith(extension));
}

export function rewriteImport(specifier: string): string {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  if (!relative || isDeclarationFile(specifier)) return specifier;
  for (const extension of EXTENSIONS) {
    if (specifier.endsWith(extension.source)) {
      return specifier.slice(0, -extension.source.length) + extension.js;
    }
  }
  return specifier;
}

export function emittedFiles(source: string, options: EmitOptions): string[] {
  if (isDeclarationFile(source) || options.noEmit) return [];

  const inRoot = posix.relative(options.rootDir, source);
  if (inRoot.startsWith("../") || posix.isAbsolute(inRoot)) {
    throw new RangeError(`${source} is not under rootDir ${options.rootDir}`);
  }

  const extension = EXTENSIONS.find((item) => source.endsWith(item.source));
  if (extension === undefined) throw new TypeError(`${source} is not a TypeScript file`);
  const base = posix.join(options.outDir, inRoot.slice(0, -extension.source.length));

  const files: string[] = [];
  if (!options.emitDeclarationOnly) {
    files.push(base + extension.js);
    if (options.sourceMap) files.push(base + extension.js + ".map");
  }
  if (options.declaration) {
    files.push(base + extension.declaration);
    if (options.declarationMap) files.push(base + extension.declaration + ".map");
  }
  return files;
}
