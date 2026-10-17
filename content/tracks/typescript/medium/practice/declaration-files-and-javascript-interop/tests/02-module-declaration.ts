// MetronomeModule declares the four exports with exact types: what the compiler accepts and
// what it rejects when the module is used.
import { metronome, type MetronomeModule, type Pattern } from "./solution.js";

const version: string = metronome.VERSION;
const interval: number = metronome.beatInterval(60);
const march: Pattern | undefined = metronome.patternFor("march");
check.equal([version, interval], ["2.3.0", 1000], "VERSION and beatInterval(60)");
check.equal(march, { name: "march", beats: 2, accents: [true, false] }, "patternFor finds the march");
check.equal(metronome.patternFor("polka"), undefined, "patternFor gives undefined for a pattern it does not have");
if (march !== undefined) {
  check.equal(metronome.render(march), "X x", "render may be called without symbols");
}
check.throws(() => metronome.beatInterval(10), "the module itself refuses a tempo of 10 with a RangeError", RangeError);

const sameShape: MetronomeModule = {
  VERSION: "0.0.1",
  beatInterval: (bpm) => 60000 / bpm,
  patternFor: () => undefined,
  render: () => "",
};
check.equal(sameShape.beatInterval(100), 600, "any object with the four members is a MetronomeModule");

function typeChecksOnly(pattern: Pattern): void {
  // @ts-expect-error VERSION is a constant of the module, so it is read-only
  metronome.VERSION = "3.0.0";
  // @ts-expect-error beatInterval returns a number
  const asText: string = metronome.beatInterval(120);
  // @ts-expect-error patternFor may find nothing, so its result may be undefined
  const surely: Pattern = metronome.patternFor("waltz");
  // @ts-expect-error patternFor takes the pattern's name
  metronome.patternFor(3);
  // @ts-expect-error render needs a pattern
  metronome.render();
  // @ts-expect-error render returns a string
  const drawn: number = metronome.render(pattern);
  // @ts-expect-error the module has no stop function, so none is declared
  metronome.stop();
}
check.true(typeof typeChecksOnly === "function", "MetronomeModule's members have exact types");
