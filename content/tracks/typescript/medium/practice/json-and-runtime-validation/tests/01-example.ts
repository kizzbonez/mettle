// The example from the instructions.
import { parseDay, parseDonation } from "./solution.js";

check.equal(
  parseDonation('{"donor":" Bakery Lind ","item":"rye bread","portions":6,"bestBefore":"2026-10-19"}'),
  {
    ok: true,
    value: { donor: "Bakery Lind", item: "rye bread", portions: 6, bestBefore: new Date("2026-10-19"), allergens: [] },
  },
  "the bakery's donation of rye bread",
);
check.equal(
  parseDonation('{"donor":"","item":"soup","portions":"4","bestBefore":"2026-02-30","allergens":["celery"]}'),
  {
    ok: false,
    errors: [
      "donor must be a non-empty string",
      "portions must be a whole number from 1 to 50",
      "bestBefore must be a real date written YYYY-MM-DD",
    ],
  },
  "the soup donation with three problems",
);
check.equal(parseDonation("{ portions: 4 }"), { ok: false, errors: ["not valid JSON"] }, "text that is not JSON");
check.equal(parseDay("2026-02-30"), undefined, 'parseDay("2026-02-30")');

const result = parseDonation('{"donor":"Ana","item":"apples","portions":10,"bestBefore":"2026-10-24"}');
if (result.ok) {
  check.equal(result.value.bestBefore.getUTCDate(), 24, "after checking ok, the value's bestBefore is a Date");
} else {
  fail("a valid donation was rejected", result.errors.join("; "));
}
