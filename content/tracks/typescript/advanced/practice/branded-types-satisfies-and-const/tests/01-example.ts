// The example from the instructions.
import { quote, toGrams } from "./solution.js";

const parcel = toGrams(1200);
check.equal(quote("standard", parcel), 800, "a 1200 g standard parcel is charged for two kilograms");
check.equal(quote("express", toGrams(1000)), 950, "a 1000 g express parcel is charged for one kilogram");
check.throws(() => toGrams(12.5), "toGrams refuses a fraction of a gram", RangeError);

export function misuse(): void {
  // @ts-expect-error a plain number is not a checked weight
  quote("standard", 1200);
  // @ts-expect-error a price is not a weight
  quote("standard", quote("express", parcel));
  // @ts-expect-error there is no overnight service
  quote("overnight", parcel);
}
