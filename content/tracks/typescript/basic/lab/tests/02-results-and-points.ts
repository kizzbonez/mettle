import { parseResult, points, type Attempt, type Result } from "./solution.js";

check.equal(points("flash"), 25, "points for a flash");
check.equal(points("top"), 20, "points for a top");
check.equal(points("zone"), 10, "points for a zone");
check.equal(points("miss"), 0, "points for a miss");

check.equal(parseResult("flash"), "flash", "parseResult with a result written exactly");
check.equal(parseResult(" Top "), "top", "parseResult ignores spaces around the word and its case");
check.equal(parseResult("ZONE"), "zone", "parseResult with a result in capitals");
check.equal(parseResult("miss"), "miss", "parseResult with miss");
check.equal(parseResult("flashed"), undefined, "parseResult rejects a longer word");
check.equal(parseResult("fall"), undefined, "parseResult rejects a word that is not a result");
check.equal(parseResult(""), undefined, "parseResult rejects empty text");
check.equal(parseResult("to p"), undefined, "parseResult rejects a result with a space inside it");

// These lines are type-checked but never run: the learner's types must reject each of them.
function typeChecks(): void {
  // @ts-expect-error "fall" is not one of the four results
  points("fall");
  // @ts-expect-error results are written in lower case
  const shouted: Result = "TOP";
  // @ts-expect-error an attempt's result must be one of the four results
  const slipped: Attempt = { climber: "ada", problem: 1, result: "slip" };
  console.log(shouted, slipped);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
