import { claim, countByStation, type FoundItem } from "./solution.js";

check.equal(countByStation([]), {}, "the count for no items");

const items: readonly FoundItem[] = [
  { tag: "LP-20", description: "phone", station: "Harbour" },
  { tag: "LP-21", description: "keys", station: "Harbour" },
  { tag: "LP-22", description: "keys", station: "Harbour", claimedBy: "Tom" },
  { tag: "LP-23", description: "glasses", station: "Old Town" },
];
check.equal(countByStation(items), { Harbour: 3, "Old Town": 1 }, "the count per station, claimed items included");

const phone: FoundItem = { tag: "LP-30", description: "phone", station: "Central" };
const first = claim(phone, "Ana");
check.equal(first, { tag: "LP-30", description: "phone", station: "Central", claimedBy: "Ana" }, "the claimed copy");
check.equal(phone, { tag: "LP-30", description: "phone", station: "Central" }, "the item passed to claim is unchanged");
check.true(first !== phone, "claim returns a new object");

const second = claim(first, "Bea");
check.equal(second.claimedBy, "Bea", "claiming again replaces the name");
check.equal(first.claimedBy, "Ana", "the earlier claimed copy is unchanged");
