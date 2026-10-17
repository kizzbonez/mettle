// ringNumbers is an endless, lazy generator; rareSpecies chains iterator helpers.
import { rareSpecies, ringNumbers } from "./solution.js";

const rings = ringNumbers("GB", 7);
check.equal(rings.next().value, "GB-0007", "the first ring number");
check.equal(rings.next().value, "GB-0008", "the second ring number");
check.equal(rings.next().done, false, "the generator never ends");
check.equal(ringNumbers("NL", 9998).take(3).toArray(), ["NL-9998", "NL-9999", "NL-10000"], "a five-digit number is not cut");
check.equal(ringNumbers("BE", 1).drop(98).take(2).toArray(), ["BE-0099", "BE-0100"], "ring numbers far into the sequence");

let seen = 0;
for (const ring of ringNumbers("DK", 0)) {
  seen += 1;
  if (ring === "DK-0004") {
    break;
  }
}
check.equal(seen, 5, "a for...of loop over the endless generator stops when asked");

const counts = new Map([
  ["egret", 1],
  ["coot", 4],
  ["owl", 1],
  ["swan", 2],
  ["teal", 1],
]);
check.equal(rareSpecies(counts, 10), ["egret", "owl", "teal"], "every species seen once, in the map's order");
check.equal(rareSpecies(counts, 2), ["egret", "owl"], "at most limit species");
check.equal(rareSpecies(counts, 0), [], "a limit of 0");
check.equal(rareSpecies(new Map([["coot", 3]]), 5), [], "no species seen only once");
check.equal(counts.size, 5, "rareSpecies does not change the map");

function typeChecksOnly(): void {
  // @ts-expect-error ring numbers are strings
  const numbers: number[] = ringNumbers("GB", 1).take(2).toArray();
}
check.true(typeof typeChecksOnly === "function", "ringNumbers yields strings");
