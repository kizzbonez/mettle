// isMaterial and profileFor accept only the table's own names, whatever the form sends.
import { isMaterial, MATERIALS, profileFor, type Material, type Profile } from "./solution.js";

for (const name of ["pla", "petg", "abs"]) {
  check.true(isMaterial(name), `isMaterial accepts ${name}`);
}
for (const name of ["PLA", "nylon", "", " pla", "toString", "constructor", "hasOwnProperty"]) {
  check.true(!isMaterial(name), `isMaterial refuses "${name}"`);
}

check.true(profileFor("petg") === MATERIALS.petg && profileFor("abs") === MATERIALS.abs, "profileFor returns the table's entries");
check.equal(profileFor("toString"), undefined, "an inherited name finds no profile");
check.equal(profileFor("constructor"), undefined, "constructor finds no profile");
check.equal(profileFor("Abs"), undefined, "names are matched exactly");

const typed: string[] = ["abs", "wood", "pla"];
const known: Material[] = typed.filter(isMaterial);
check.equal(known, ["abs", "pla"], "filter(isMaterial) keeps the known names");

function typeChecksOnly(): void {
  // @ts-expect-error profileFor may find nothing
  const surely: Profile = profileFor("pla");
}
check.true(typeof typeChecksOnly === "function", "profileFor's result may be undefined");
