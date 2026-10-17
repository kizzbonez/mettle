// tally counts with a Map<string, number>, keys in first-seen order.
import { tally } from "./solution.js";

const morning: readonly string[] = ["kingfisher", "coot", "coot", "mallard", "coot", "kingfisher", "grebe"];
const snapshot = [...morning];
const counts = tally(morning);
check.true(counts instanceof Map, "tally returns a Map");
check.equal([...counts.keys()], ["kingfisher", "coot", "mallard", "grebe"], "the species in the order first seen");
check.equal([...counts.values()], [2, 3, 1, 1], "the count of each species");
check.equal(counts.size, 4, "one entry per species");
check.equal(counts.get("heron"), undefined, "a species never seen has no entry");
check.equal(morning, snapshot, "tally does not change the list it is given");
check.equal(tally([]).size, 0, "an empty walk gives an empty tally");
check.equal([...tally(["Coot", "coot"])], [["Coot", 1], ["coot", 1]], "species names are compared exactly");

const robins: number = counts.get("robin") ?? 0;
check.equal(robins, 0, "a missing species counts as 0 with ??");

function typeChecksOnly(): void {
  // @ts-expect-error a tally holds numbers
  tally(morning).set("coot", "many");
  // @ts-expect-error a tally's keys are species names
  tally(morning).get(7);
}
check.true(typeof typeChecksOnly === "function", "tally returns a Map<string, number>");
