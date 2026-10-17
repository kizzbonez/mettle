// barDisplay describes a bar of every pattern, rounds the interval, and refuses unknown patterns.
import { barDisplay } from "./solution.js";

check.equal(barDisplay("march", 120), "march at 120 bpm: X x (500 ms)", "a march at 120 bpm");
check.equal(barDisplay("four-four", 72), "four-four at 72 bpm: X x x x (833 ms)", "four-four at 72 bpm, rounded down");
check.equal(barDisplay("six-eight", 140), "six-eight at 140 bpm: X x x X x x (429 ms)", "six-eight at 140 bpm, rounded up");
check.equal(barDisplay("waltz", 300), "waltz at 300 bpm: X x x (200 ms)", "the fastest tempo the module allows");

const unknown = check.throws(() => barDisplay("polka", 100), "barDisplay throws for a pattern the module does not have");
check.equal(unknown.message, "unknown pattern: polka", "the message names the unknown pattern");
check.true(!(unknown instanceof RangeError), "an unknown pattern is a plain Error, not the module's RangeError");
check.throws(() => barDisplay("toString", 100), "an inherited name is an unknown pattern too");
check.throws(() => barDisplay("waltz", 400), "a tempo the module refuses throws the module's RangeError", RangeError);
