import { binColour, type DropOff } from "./solution.js";

check.equal(binColour("glass"), "green", "the bin for glass");
check.equal(binColour("paper"), "blue", "the bin for paper");
check.equal(binColour("metal"), "grey", "the bin for metal");

// These lines are type-checked but never run: your types must reject each of them.
function typeChecks(): void {
  // @ts-expect-error there is no bin for plastic
  console.log(binColour("plastic"));
  // @ts-expect-error a drop-off of loose plastic is not accepted either
  const loose: DropOff = { kind: "loose", material: "plastic", kg: 2 };
  console.log(loose);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
