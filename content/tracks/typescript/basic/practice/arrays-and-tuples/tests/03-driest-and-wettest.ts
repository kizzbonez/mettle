import { driestAndWettest } from "./solution.js";

check.equal(driestAndWettest([7]), [7, 7], "one reading is both the lowest and the highest");
check.equal(driestAndWettest([3, 9, 1]), [1, 9], "the lowest reading comes first, then the highest");
check.equal(driestAndWettest([2.5, 0.5, 30, 0.5]), [0.5, 30], "readings with fractions");

const [low, high]: [number, number] = driestAndWettest([5, 15, 10]);
check.equal(low, 5, "the first element of the pair, unpacked by destructuring");
check.equal(high, 15, "the second element of the pair, unpacked by destructuring");

// This line is type-checked but never run: your return type must reject it.
function typeChecks(): void {
  // @ts-expect-error the pair has no third element
  console.log(driestAndWettest([1, 2])[2]);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
