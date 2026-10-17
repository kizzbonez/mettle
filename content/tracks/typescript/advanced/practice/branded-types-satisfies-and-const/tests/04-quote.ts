// quote: every started kilogram is charged, at the price of the chosen service.
import { quote, toGrams, type Cents } from "./solution.js";

const cases: [number, "economy" | "standard" | "express", number, string][] = [
  [1, "standard", 400, "one gram is charged as a whole kilogram"],
  [999, "standard", 400, "just under a kilogram is one kilogram"],
  [1000, "standard", 400, "exactly one kilogram is one kilogram"],
  [1001, "standard", 800, "one gram over a kilogram starts a second one"],
  [2001, "economy", 750, "economy charges 250 cents per started kilogram"],
  [3000, "express", 2850, "express charges 950 cents per started kilogram"],
  [20000, "economy", 5000, "a heavy parcel is charged for every kilogram"],
];
for (const [grams, service, expected, what] of cases) {
  check.equal(quote(service, toGrams(grams)), expected, what);
}

const price: Cents = quote("express", toGrams(500));
const total: number = price + quote("economy", toGrams(500));
check.equal(total, 1200, "two prices add up as plain numbers");
