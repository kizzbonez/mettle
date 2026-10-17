import { createLruCache, makeLoan, mostBorrowed } from "./solution.js";

// The example from the instructions.

check.equal(
  { ...makeLoan({ title: "Middlemarch", id: "L-1", member: "M-77", dueDay: 12 }) },
  { id: "L-1", title: "Middlemarch", member: "M-77", dueDay: 12, renewals: 0, note: undefined },
  "a loan without renewals or a note",
);
check.equal(
  Object.keys(makeLoan({ id: "L-2", title: "Beloved", member: "M-3", dueDay: 9, note: "torn cover" })),
  ["id", "title", "member", "dueDay", "renewals", "note"],
  "the fields of a loan, in order",
);

check.equal(mostBorrowed(["Beloved", "Dune", "Dune", "Beloved", "Emma"]), "Beloved", "a tie goes to the title seen first");
check.equal(mostBorrowed([]), undefined, "an empty list has no most borrowed title");

const cache = createLruCache<string>(2);
cache.set("isbn-1", "Dune");
cache.set("isbn-2", "Emma");
check.equal(cache.get("isbn-1"), "Dune", "a cached value");
cache.set("isbn-3", "Kim");
check.equal(cache.keys(), ["isbn-1", "isbn-3"], "the least recently used key was dropped");
check.equal(cache.get("isbn-2"), undefined, "a dropped key is no longer cached");
check.equal(cache.size, 2, "the cache holds its limit");
