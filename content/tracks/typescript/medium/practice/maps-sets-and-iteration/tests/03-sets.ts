// newForTheYear and seenOnEveryWalk combine sets without changing them.
import { newForTheYear, seenOnEveryWalk } from "./solution.js";

const yearList = new Set(["robin", "wren", "jay"]);
function* lateWalk(): Generator<string> {
  yield "owl";
  yield "robin";
  yield "owl";
  yield "nightjar";
}
check.equal(newForTheYear(yearList, lateWalk()), new Set(["owl", "nightjar"]), "a walk given as a generator, with a repeat");
check.equal(newForTheYear(yearList, new Set(["wren", "egret"])), new Set(["egret"]), "a walk given as a set");
check.equal(newForTheYear(yearList, ["robin", "jay"]), new Set(), "nothing new");
check.equal(newForTheYear(new Set(), ["teal", "teal"]), new Set(["teal"]), "everything is new on an empty year list");
check.true(newForTheYear(yearList, ["owl"]) instanceof Set, "newForTheYear returns a Set");
check.equal(yearList, new Set(["robin", "wren", "jay"]), "the year list is not changed");

const walks = [
  new Set(["robin", "jay", "heron", "coot"]),
  new Set(["coot", "robin", "wren"]),
  new Set(["robin", "egret", "coot"]),
];
check.equal(seenOnEveryWalk(walks), new Set(["robin", "coot"]), "the species on all three walks");
check.equal(seenOnEveryWalk([...walks, new Set(["swan"])]), new Set(), "no species on every walk");
check.equal(seenOnEveryWalk([]), new Set(), "no walks at all");
check.equal(walks[0], new Set(["robin", "jay", "heron", "coot"]), "the walks are not changed");

const only = new Set(["teal", "swan"]);
const result = seenOnEveryWalk([only]);
check.equal(result, only, "one walk gives that walk's species");
check.true(result !== only, "with one walk, the result is a new set");
