import { removedOptions } from "./solution.js";

function config(options: Record<string, unknown>): string {
  return JSON.stringify({ compilerOptions: options }, null, 2);
}

// A modern configuration has nothing to remove.
check.equal(
  removedOptions(config({
    module: "nodenext",
    target: "es2025",
    types: ["node"],
    strict: true,
    noUncheckedIndexedAccess: true,
    verbatimModuleSyntax: true,
    esModuleInterop: true,
    paths: { "#/*": ["./src/*"] },
  })),
  [],
  "a modern Node.js configuration",
);
check.equal(removedOptions("{}"), [], "an empty configuration");
check.equal(removedOptions('{ "include": ["src"] }'), [], "a configuration without compilerOptions");
check.equal(removedOptions(config({ module: "preserve", moduleResolution: "bundler" })), [], "bundler resolution is still allowed");

// Each value rule, in either case.
check.equal(removedOptions(config({ target: "es5" })), ["target"], "target es5");
check.equal(removedOptions(config({ target: "Es5" })), ["target"], "target is compared without case");
check.equal(removedOptions(config({ target: "es2015" })), [], "target es2015 is still allowed");
check.equal(removedOptions(config({ module: "AMD" })), ["module"], "module AMD");
check.equal(removedOptions(config({ module: "umd" })), ["module"], "module umd");
check.equal(removedOptions(config({ module: "System" })), ["module"], "module System");
check.equal(removedOptions(config({ module: "commonjs" })), [], "module commonjs is still allowed");
check.equal(removedOptions(config({ moduleResolution: "Node10" })), ["moduleResolution"], "moduleResolution Node10");
check.equal(removedOptions(config({ moduleResolution: "classic" })), ["moduleResolution"], "moduleResolution classic");
check.equal(removedOptions(config({ moduleResolution: "nodenext" })), [], "moduleResolution nodenext is allowed");

// Options refused whatever their value.
check.equal(removedOptions(config({ baseUrl: "." })), ["baseUrl"], "baseUrl");
check.equal(removedOptions(config({ downlevelIteration: true })), ["downlevelIteration"], "downlevelIteration");
check.equal(removedOptions(config({ outFile: "" })), ["outFile"], "outFile, even when empty");

// Options that may no longer be false.
check.equal(
  removedOptions(config({ esModuleInterop: false, allowSyntheticDefaultImports: false, alwaysStrict: false })),
  ["esModuleInterop", "allowSyntheticDefaultImports", "alwaysStrict"],
  "the three options that may not be false",
);
check.equal(
  removedOptions(config({ esModuleInterop: true, allowSyntheticDefaultImports: true, alwaysStrict: true })),
  [],
  "the same three options set to true",
);

// Several at once, in the order of the file.
check.equal(
  removedOptions(config({
    outFile: "out.js",
    strict: true,
    alwaysStrict: false,
    moduleResolution: "node",
    baseUrl: "./src",
    target: "ES5",
    module: "system",
  })),
  ["outFile", "alwaysStrict", "moduleResolution", "baseUrl", "target", "module"],
  "every refused option, in the order the file lists them",
);

// A value that is not a string is not one of the refused values.
check.equal(removedOptions(config({ target: 5, module: ["amd"] })), [], "values that are not strings");
