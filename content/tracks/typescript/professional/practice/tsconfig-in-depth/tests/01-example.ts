import { isEnabled, removedOptions } from "./solution.js";

// The example from the instructions.

const legacy = `{
  "compilerOptions": {
    "target": "ES5",
    "strict": false,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outFile": "bundle.js"
  }
}`;

check.equal(removedOptions(legacy), ["target", "moduleResolution", "outFile"], "removedOptions lists the refused options of the legacy config in order");
check.equal(isEnabled(legacy, "strict"), false, "strict set to false is off");
check.equal(isEnabled(legacy, "strictNullChecks"), true, "strictNullChecks set on its own is on, even with strict off");
check.equal(isEnabled(legacy, "noImplicitAny"), false, "noImplicitAny follows strict when it is not set");
check.equal(isEnabled("{}", "strict"), true, "strict is on by default");
check.equal(isEnabled("{}", "noUncheckedIndexedAccess"), false, "noUncheckedIndexedAccess is off by default");
check.equal(
  isEnabled('{ "compilerOptions": { "verbatimModuleSyntax": true } }', "isolatedModules"),
  true,
  "verbatimModuleSyntax implies isolatedModules",
);
check.throws(() => removedOptions("[]"), "a tsconfig.json holding an array is refused", TypeError);
