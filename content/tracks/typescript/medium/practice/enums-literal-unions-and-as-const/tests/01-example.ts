// The example from the instructions.
import { isRun, lessonsRequired, Pass, passLabel, passPrice } from "./solution.js";

check.equal(passPrice(Pass.Day), 5600, "passPrice(Pass.Day)");
check.equal(passPrice("WEEK"), 26500, 'passPrice("WEEK"), a plain code');
check.equal(passLabel("Morning"), "Morning (AM)", 'passLabel("Morning")');
check.equal(isRun("red"), true, 'isRun("red")');
check.equal(isRun("double-black"), false, 'isRun("double-black")');
check.equal(lessonsRequired("black"), 6, 'lessonsRequired("black")');
check.equal(Object.keys(Pass), ["Morning", "Day", "Week"], "the names in Pass");

function typeChecksOnly(): void {
  // @ts-expect-error "SEASON" is not a pass code
  passPrice("SEASON");
}
check.true(typeof typeChecksOnly === "function", "passPrice accepts only the three codes");
