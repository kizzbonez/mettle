import { OTHER_FLAGS, isEnabled, removedOptions } from "./solution.js";

function config(options: Record<string, unknown>): string {
  return JSON.stringify({ compilerOptions: options });
}

// Outside the strict family, everything is off by default, even with strict on.
for (const flag of OTHER_FLAGS) {
  check.equal(isEnabled("{}", flag), false, `${flag} is off by default`);
  check.equal(isEnabled(config({ strict: true }), flag), false, `${flag} is not turned on by strict`);
  check.equal(isEnabled(config({ [flag]: true }), flag), true, `${flag} turned on`);
}

// isolatedModules is implied by verbatimModuleSyntax, and only by it.
check.equal(isEnabled(config({ verbatimModuleSyntax: true }), "isolatedModules"), true, "verbatimModuleSyntax implies isolatedModules");
check.equal(isEnabled(config({ verbatimModuleSyntax: false }), "isolatedModules"), false, "verbatimModuleSyntax off implies nothing");
check.equal(isEnabled(config({ isolatedModules: true }), "verbatimModuleSyntax"), false, "isolatedModules does not imply verbatimModuleSyntax");
check.equal(isEnabled(config({ erasableSyntaxOnly: true }), "isolatedModules"), false, "erasableSyntaxOnly does not imply isolatedModules");

// The production configuration from the lesson.
const production = config({
  module: "nodenext",
  target: "es2025",
  types: ["node"],
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  noImplicitOverride: true,
  verbatimModuleSyntax: true,
  erasableSyntaxOnly: true,
});
for (const flag of ["strict", "strictNullChecks", ...OTHER_FLAGS] as const) {
  check.true(isEnabled(production, flag), `${flag} in the production configuration`);
}

// Files that are not a tsconfig object.
for (const text of ["[]", '"strict"', "null", "42"]) {
  check.throws(() => isEnabled(text, "strict"), `isEnabled refuses a file holding ${text}`, TypeError);
  check.throws(() => removedOptions(text), `removedOptions refuses a file holding ${text}`, TypeError);
}
check.throws(() => isEnabled('{ "compilerOptions": [] }', "strict"), "compilerOptions holding an array", TypeError);
check.throws(() => removedOptions('{ "compilerOptions": "strict" }'), "compilerOptions holding a string", TypeError);
check.throws(() => removedOptions('{ "compilerOptions": null }'), "compilerOptions holding null", TypeError);
check.throws(() => isEnabled('{ "compilerOptions": { "strict": true, } }', "strict"), "a trailing comma is broken JSON", SyntaxError);
