// Pattern and RenderSymbols match the module's JSDoc, and render draws with the symbols given.
import { metronome, type Pattern, type RenderSymbols } from "./solution.js";

const polka: Pattern = { name: "polka", beats: 2, accents: [true, true] };
const noSymbols: RenderSymbols = {};
const dots: RenderSymbols = { beat: "." };
const full: RenderSymbols = { accent: "#", beat: "-" };
check.equal(metronome.render(polka, noSymbols), "X X", "a pattern of your own, drawn with an empty set of symbols");

const sixEight = metronome.patternFor("six-eight");
if (sixEight === undefined) {
  fail('patternFor("six-eight") found no pattern');
} else {
  check.equal(sixEight.beats, 6, "six-eight has six beats");
  check.equal(metronome.render(sixEight, dots), "X . . X . .", "only the beat symbol given");
  check.equal(metronome.render(sixEight, full), "# - - # - -", "both symbols given");
  check.equal(metronome.render(sixEight, { accent: ">" }), "> x x > x x", "only the accent symbol given");
}
check.equal(metronome.patternFor("toString"), undefined, "an inherited name is not a pattern");

function typeChecksOnly(): void {
  // @ts-expect-error accents are booleans
  const textAccents: Pattern = { name: "polka", beats: 2, accents: ["X", "x"] };
  // @ts-expect-error a pattern has a number of beats
  const noBeats: Pattern = { name: "polka", accents: [true, false] };
  // @ts-expect-error a symbol is a string
  const numbered: RenderSymbols = { accent: 1 };
  // @ts-expect-error render knows only the accent and beat symbols
  metronome.render(polka, { rest: "_" });
}
check.true(typeof typeChecksOnly === "function", "Pattern and RenderSymbols have exactly the module's properties");
