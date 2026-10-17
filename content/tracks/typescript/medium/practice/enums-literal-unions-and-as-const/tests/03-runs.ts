// RUNS keeps its literal values, Run is derived from it, and isRun checks strings.
import { isRun, RUNS, type Run } from "./solution.js";

check.equal([...RUNS], ["green", "blue", "red", "black", "off-piste"], "the five grades, in order");
for (const run of RUNS) {
  check.true(isRun(run), `isRun accepts ${run}`);
}
for (const text of ["Green", "RED", "grey", "off piste", "offpiste", "double-black", "", " blue", "toString"]) {
  check.true(!isRun(text), `isRun refuses "${text}"`);
}

const typed: string[] = ["black", "mogul", "blue"];
const known: Run[] = typed.filter(isRun);
check.equal(known, ["black", "blue"], "filter(isRun) keeps the real grades");

function typeChecksOnly(): void {
  const red: Run = "red";
  // @ts-expect-error "double-black" is not one of the grades
  const doubleBlack: Run = "double-black";
  // @ts-expect-error RUNS is read-only
  RUNS.push("yellow");
}
check.true(typeof typeChecksOnly === "function", "Run is the union of the five grades and RUNS is read-only");
