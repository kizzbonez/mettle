// The example from the instructions.
import { newForTheYear, rareSpecies, ringNumbers, seenOnEveryWalk, tally } from "./solution.js";

const walk = ["robin", "wren", "robin", "jay", "heron", "robin", "wren"];
check.equal([...tally(walk)], [["robin", 3], ["wren", 2], ["jay", 1], ["heron", 1]], "the tally of the walk, in first-seen order");
check.equal(newForTheYear(new Set(["robin", "jay", "blackbird"]), walk), new Set(["wren", "heron"]), "the species new for the year");
check.equal(
  seenOnEveryWalk([new Set(["robin", "jay"]), new Set(["jay", "wren", "robin"])]),
  new Set(["robin", "jay"]),
  "the species seen on both walks",
);
check.equal(ringNumbers("NL", 41).take(3).toArray(), ["NL-0041", "NL-0042", "NL-0043"], 'the first three ring numbers from NL 41');
check.equal(rareSpecies(tally(walk), 5), ["jay", "heron"], "the species seen once");
