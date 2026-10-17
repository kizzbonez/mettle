import { itemLabel } from "./solution.js";

check.equal(
  itemLabel({ tag: "LP-7", description: "violin in a black case", station: "Harbour" }),
  "LP-7: violin in a black case, found at Harbour",
  "the label of an item nobody has claimed",
);
check.equal(
  itemLabel({ tag: "LP-8", description: "library book", station: "Old Town", claimedBy: "Mei Lin" }),
  "LP-8: library book, found at Old Town, claimed by Mei Lin",
  "the label of a claimed item",
);

// Structural typing: an object with an extra property still fits FoundItem
// when it is passed as a variable rather than written as a literal.
const bag = { tag: "LP-9", description: "green rucksack", station: "Central", colour: "green" };
check.equal(itemLabel(bag), "LP-9: green rucksack, found at Central", "the label of an object with an extra property");
