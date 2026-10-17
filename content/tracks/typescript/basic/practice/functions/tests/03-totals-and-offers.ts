import { priceWithOffer, totalCents } from "./solution.js";

check.equal(totalCents(450), 450, "the total of one price");
check.equal(totalCents(100, 200, 300, 400, 500), 1500, "the total of five prices");
check.equal(totalCents(), 0, "the total of no prices at all");

const summerOffer = (cents: number): number => cents - 50;
check.equal(priceWithOffer(300, summerOffer), 250, "an offer passed by its name");
check.equal(priceWithOffer(100, (cents) => cents / 3), 33, "an offer whose result is rounded down to whole cents");
check.equal(priceWithOffer(325, (cents) => cents / 2), 163, "an offer whose result is rounded up at half a cent");
check.equal(priceWithOffer(30, summerOffer), 0, "an offer worth more than the price gives 0");
check.equal(priceWithOffer(275, (cents) => cents), 275, "an offer that changes nothing");

// These lines are type-checked but never run.
function typeChecks(): void {
  // @ts-expect-error totalCents adds numbers only
  console.log(totalCents(250, "300"));
  // @ts-expect-error an offer takes a price in cents, not text
  console.log(priceWithOffer(300, (text: string) => text.length));
  // @ts-expect-error the offer is a function, not a number
  console.log(priceWithOffer(300, 100));
}
check.true(typeof typeChecks === "function", "the type checks compiled");
