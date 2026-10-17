import { type FoundItem } from "./solution.js";

const hat: FoundItem = { tag: "LP-1", description: "grey hat", station: "Central" };
const gloves: FoundItem = { tag: "LP-2", description: "wool gloves", station: "Central", claimedBy: "Rui" };
check.equal(hat.claimedBy, undefined, "an item nobody has claimed has no claimedBy");
check.equal(gloves.claimedBy, "Rui", "an item created with claimedBy keeps it");

// These lines are type-checked but never run: your interface must reject each of them.
function typeChecks(): void {
  // @ts-expect-error a tag cannot change once the item is logged
  hat.tag = "LP-99";
  // @ts-expect-error every item needs a description
  const noDescription: FoundItem = { tag: "LP-3", station: "Central" };
  // @ts-expect-error claimedBy holds a name, not a number
  const numbered: FoundItem = { tag: "LP-4", description: "cap", station: "Central", claimedBy: 7 };
  // @ts-expect-error a misspelled property in an object literal is caught
  const misspelled: FoundItem = { tag: "LP-5", description: "cap", station: "Central", claimedby: "Rui" };
  console.log(noDescription, numbered, misspelled);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
