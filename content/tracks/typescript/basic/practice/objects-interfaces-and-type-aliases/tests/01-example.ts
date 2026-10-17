import { claim, countByStation, itemLabel, type FoundItem } from "./solution.js";

// The example from the instructions.
const umbrella: FoundItem = { tag: "LP-104", description: "blue umbrella", station: "Riverside" };
const scarf: FoundItem = { tag: "LP-105", description: "red scarf", station: "Central" };

check.equal(itemLabel(umbrella), "LP-104: blue umbrella, found at Riverside", "itemLabel(umbrella)");
const collected = claim(umbrella, "Ines");
check.equal(
  itemLabel(collected),
  "LP-104: blue umbrella, found at Riverside, claimed by Ines",
  'itemLabel(claim(umbrella, "Ines"))',
);
check.equal(umbrella.claimedBy, undefined, "umbrella.claimedBy after claiming a copy of it");
check.equal(countByStation([umbrella, scarf, collected]), { Riverside: 2, Central: 1 }, "countByStation([umbrella, scarf, collected])");
