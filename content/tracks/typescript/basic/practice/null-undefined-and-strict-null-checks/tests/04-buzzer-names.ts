import { buzzerName } from "./solution.js";

check.equal(buzzerName({ name: "Ivo", flat: "5A", awayUntil: null }), "Ivo", "a resident who is at home");
check.equal(
  buzzerName({ name: "Juno", flat: "5B", awayUntil: "28 August" }),
  "Juno (away until 28 August)",
  "a resident who is away",
);
check.equal(
  buzzerName({ name: "Kai", flat: "5C", phone: "555-0150", ringVolume: 0, awayUntil: "1 March" }),
  "Kai (away until 1 March)",
  "a resident who is away, with a phone and a muted buzzer",
);
