import { findResident, type Resident } from "./solution.js";

const building: readonly Resident[] = [
  { name: "Mei", flat: "3C", awayUntil: null },
  { name: "Oskar", flat: "4D", phone: "555-0177", awayUntil: null },
  { name: "Pia", flat: "4D", awayUntil: null },
];
check.equal(findResident(building, "3C")?.name, "Mei", "the resident of a flat that is in the list");
check.equal(findResident(building, "4D")?.name, "Oskar", "the first resident listed for a shared flat");
check.equal(findResident(building, "5E"), undefined, "a flat nobody lives in");
check.equal(findResident(building, "3c"), undefined, "a flat must match exactly");
check.equal(findResident([], "3C"), undefined, "a building with no residents");

// These lines are type-checked but never run.
function typeChecks(): void {
  const maybe: Resident | undefined = findResident(building, "3C");
  // @ts-expect-error nobody may live in the flat, so the result may be undefined
  const surely: Resident = findResident(building, "3C");
  console.log(maybe, surely);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
