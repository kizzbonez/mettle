// insert() accepts only whole positive amounts, start() takes the price or refuses, and the
// change stays in the machine.
import { Washer } from "./solution.js";

const cold = new Washer("W2", false);
check.equal(cold.credit, 0, "a new machine holds no credit");
check.equal(cold.price(), 350, "the price of a cold wash");

for (const bad of [0, -50, 12.5, Number.NaN]) {
  check.throws(() => cold.insert(bad), `insert(${bad}) is refused with a RangeError`, RangeError);
}
check.equal(cold.credit, 0, "refused coins leave the credit unchanged");

cold.insert(100);
cold.insert(200);
check.throws(() => cold.start(), "a cycle cannot start with 300 cents of a 350-cent price");
check.equal(cold.credit, 300, "a refused start leaves the credit unchanged");
check.true(!(check.throws(() => cold.start(), "start refuses again") instanceof RangeError),
  "a refused start throws a plain Error, not a RangeError");

cold.insert(50);
check.equal(cold.start(), "W2 started", "a cycle starts when the credit equals the price exactly");
check.equal(cold.credit, 0, "an exact payment leaves no credit");

cold.insert(1000);
cold.start();
cold.start();
check.equal(cold.credit, 300, "two cycles in a row each take their price");
check.throws(() => cold.start(), "a third cycle needs more coins");

function typeChecksOnly(): void {
  // @ts-expect-error the credit can only be read, through its getter
  cold.credit = 1000;
}
check.true(typeof typeChecksOnly === "function", "the credit is read-only for the compiler");
