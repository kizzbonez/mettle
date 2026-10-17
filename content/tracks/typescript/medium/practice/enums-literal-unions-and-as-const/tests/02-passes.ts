// Pass is a plain read-only object, and the types Pass and PassName are derived from it.
import { Pass, passLabel, passPrice, type PassName } from "./solution.js";

check.equal(Object.values(Pass), ["AM", "FULL", "WEEK"], "the codes in Pass, in order");
check.equal(Object.entries(Pass).length, 3, "Pass has exactly three entries (no reverse mapping)");
check.equal([passPrice(Pass.Morning), passPrice(Pass.Day), passPrice(Pass.Week)], [3800, 5600, 26500],
  "the price of each pass, by name");
check.equal([passPrice("AM"), passPrice("FULL"), passPrice("WEEK")], [3800, 5600, 26500], "the price of each pass, by plain code");

const names: PassName[] = ["Morning", "Day", "Week"];
check.equal(names.map(passLabel), ["Morning (AM)", "Day (FULL)", "Week (WEEK)"], "the label of each pass");

const fromTablet: Pass = "FULL";
check.equal(passPrice(fromTablet), 5600, "a variable of type Pass holding a plain code");

function typeChecksOnly(): void {
  // @ts-expect-error "Season" is not a pass name
  passLabel("Season");
  // @ts-expect-error a pass code is not a pass name
  passLabel("AM");
  // @ts-expect-error "SEASON" is not a pass code
  const season: Pass = "SEASON";
  // @ts-expect-error the codes in Pass are read-only
  Pass.Day = "SEASON";
}
check.true(typeof typeChecksOnly === "function", "Pass, PassName and the object's codes are checked by the compiler");
