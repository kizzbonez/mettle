import { orderLine } from "./solution.js";

check.equal(orderLine("lemon sorbet"), "1 x lemon sorbet", "one scoop is the default");
check.equal(orderLine("vanilla", 4), "4 x vanilla", "a number of scoops without a topping");
check.equal(orderLine("vanilla", undefined, "chocolate sauce"), "1 x vanilla with chocolate sauce", "undefined scoops falls back to the default, with a topping");
check.equal(orderLine("vanilla", 2, "a flake"), "2 x vanilla with a flake", "scoops and a topping together");

// These lines are type-checked but never run.
function typeChecks(): void {
  // The scoops and the topping may both be left out.
  console.log(orderLine("mango"));
  // @ts-expect-error scoops is a number, not text
  console.log(orderLine("mango", "two"));
  // @ts-expect-error the topping is text, not a number
  console.log(orderLine("mango", 2, 3));
}
check.true(typeof typeChecks === "function", "the type checks compiled");
