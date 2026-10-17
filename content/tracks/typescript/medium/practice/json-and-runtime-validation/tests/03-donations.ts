// parseDonation checks every field, reports every problem in order, and builds a clean value.
import { parseDonation } from "./solution.js";

const good = { donor: "Ana", item: "apples", portions: 10, bestBefore: "2026-10-24" };
function errorsOf(fields: Record<string, unknown>): string[] {
  const result = parseDonation(JSON.stringify(fields));
  return result.ok ? [] : result.errors;
}

check.equal(
  parseDonation(JSON.stringify({ ...good, donor: "  Café Rosa\t", item: " soup ", allergens: ["celery", "milk"], note: "frozen" })),
  {
    ok: true,
    value: { donor: "Café Rosa", item: "soup", portions: 10, bestBefore: new Date("2026-10-24"), allergens: ["celery", "milk"] },
  },
  "a donation with allergens and an extra field, trimmed and without the extra field",
);
check.equal(errorsOf({ ...good, allergens: [] }), [], "an empty list of allergens is fine");
check.equal(errorsOf({ ...good, portions: 1 }), [], "1 portion is enough");
check.equal(errorsOf({ ...good, portions: 50 }), [], "50 portions is the most");

const portions = "portions must be a whole number from 1 to 50";
check.equal(errorsOf({ ...good, portions: 0 }), [portions], "0 portions");
check.equal(errorsOf({ ...good, portions: 51 }), [portions], "51 portions");
check.equal(errorsOf({ ...good, portions: 2.5 }), [portions], "half portions");
check.equal(errorsOf({ ...good, portions: "4" }), [portions], "portions written as text");
check.equal(errorsOf({ ...good, donor: "   " }), ["donor must be a non-empty string"], "a donor of spaces only");
check.equal(errorsOf({ ...good, item: 7 }), ["item must be a non-empty string"], "an item that is a number");
check.equal(errorsOf({ ...good, bestBefore: 20261024 }), ["bestBefore must be a real date written YYYY-MM-DD"], "a date as a number");
check.equal(errorsOf({ ...good, allergens: ["nuts", 3] }), ["allergens must be a list of strings"], "an allergen that is a number");
check.equal(errorsOf({ ...good, allergens: "nuts" }), ["allergens must be a list of strings"], "allergens as one string");
check.equal(
  errorsOf({ allergens: null }),
  [
    "donor must be a non-empty string",
    "item must be a non-empty string",
    "portions must be a whole number from 1 to 50",
    "bestBefore must be a real date written YYYY-MM-DD",
    "allergens must be a list of strings",
  ],
  "every problem is reported, in the field order",
);

for (const text of ["[1, 2]", "null", "42", '"apples"']) {
  check.equal(parseDonation(text), { ok: false, errors: ["expected an object"] }, `${text} is JSON but not an object`);
}
for (const text of ["", "{", "{'donor':'Ana'}", "undefined"]) {
  check.equal(parseDonation(text), { ok: false, errors: ["not valid JSON"] }, `"${text}" is not valid JSON`);
}
