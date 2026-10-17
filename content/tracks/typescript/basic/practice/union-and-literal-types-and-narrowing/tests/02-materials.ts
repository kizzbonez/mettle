import { parseMaterial, type Material } from "./solution.js";

check.equal(parseMaterial("glass"), "glass", "glass written exactly");
check.equal(parseMaterial("PAPER"), "paper", "paper in capitals");
check.equal(parseMaterial("\tMetal\n"), "metal", "metal with a tab and a line break around it");
check.equal(parseMaterial("cans"), undefined, "a word that is not one of the materials");
check.equal(parseMaterial("glasses"), undefined, "a longer word that starts with a material");
check.equal(parseMaterial("me tal"), undefined, "a material with a space inside it");
check.equal(parseMaterial(""), undefined, "empty text");

// These lines are type-checked but never run: your Material type must reject each of them.
function typeChecks(): void {
  const parsed: Material | undefined = parseMaterial("paper");
  // @ts-expect-error plastic is not taken at this centre
  const plastic: Material = "plastic";
  // @ts-expect-error materials are written in lower case
  const shouted: Material = "Glass";
  console.log(parsed, plastic, shouted);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
