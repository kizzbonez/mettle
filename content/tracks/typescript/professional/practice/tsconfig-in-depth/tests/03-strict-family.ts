import { STRICT_FAMILY, isEnabled, type Flag } from "./solution.js";

function config(options: Record<string, unknown>): string {
  return JSON.stringify({ compilerOptions: options });
}

// The type: exactly the flags of the two arrays and "strict".
const names: Flag[] = ["strict", "noImplicitThis", "strictBuiltinIteratorReturn", "isolatedModules", "erasableSyntaxOnly"];
check.equal(names.length, 5, "Flag accepts strict and the names in both arrays");
// @ts-expect-error "strictNull" is not one of the flags
isEnabled("{}", "strictNull");
// @ts-expect-error "target" is an option, not one of the flags
isEnabled("{}", "target");

// Defaults: the whole family is on.
for (const flag of STRICT_FAMILY) {
  check.true(isEnabled("{}", flag), `${flag} is on by default`);
  check.true(isEnabled('{ "include": ["src"] }', flag), `${flag} is on in a config without compilerOptions`);
}

// strict written out either way carries the family with it.
for (const flag of STRICT_FAMILY) {
  check.equal(isEnabled(config({ strict: true }), flag), true, `${flag} with strict: true`);
  check.equal(isEnabled(config({ strict: false }), flag), false, `${flag} with strict: false`);
}

// A member set on its own wins over strict, in both directions.
const migrating = config({ strict: false, noImplicitAny: true, strictNullChecks: true });
check.equal(isEnabled(migrating, "noImplicitAny"), true, "noImplicitAny turned on with strict off");
check.equal(isEnabled(migrating, "strictNullChecks"), true, "strictNullChecks turned on with strict off");
check.equal(isEnabled(migrating, "strictPropertyInitialization"), false, "a member not set follows strict: false");
check.equal(isEnabled(migrating, "strict"), false, "strict itself stays off");

const relaxed = config({ useUnknownInCatchVariables: false });
check.equal(isEnabled(relaxed, "useUnknownInCatchVariables"), false, "a member turned off while strict defaults to on");
check.equal(isEnabled(relaxed, "noImplicitThis"), true, "the other members keep the default");
check.equal(isEnabled(relaxed, "strict"), true, "strict keeps its default when only a member is set");

// A value that is not a boolean counts as not set.
check.equal(isEnabled(config({ strict: "false" }), "strict"), true, "strict written as a string is not set");
check.equal(isEnabled(config({ strict: false, noImplicitAny: 1 }), "noImplicitAny"), false, "a member written as a number follows strict");
