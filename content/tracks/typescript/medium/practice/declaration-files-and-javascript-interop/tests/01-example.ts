// The example from the instructions.
import { barDisplay, metronome } from "./solution.js";

check.equal(metronome.VERSION, "2.3.0", "metronome.VERSION");
check.equal(metronome.beatInterval(120), 500, "metronome.beatInterval(120)");
const waltz = metronome.patternFor("waltz");
if (waltz === undefined) {
  fail('metronome.patternFor("waltz") found no pattern');
} else {
  check.equal(waltz.accents, [true, false, false], "the accents of the waltz");
  check.equal(metronome.render(waltz, { accent: "O", beat: "." }), "O . .", "the waltz drawn with O and .");
}
check.equal(barDisplay("waltz", 90), "waltz at 90 bpm: X x x (667 ms)", 'barDisplay("waltz", 90)');

function typeChecksOnly(): void {
  // @ts-expect-error bpm is a number
  metronome.beatInterval("120");
}
check.true(typeof typeChecksOnly === "function", "beatInterval is declared to take a number");
