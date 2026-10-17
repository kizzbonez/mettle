// describe() handles all five kinds, and throws for a kind outside the union.
import { describe, type HomeEvent, type LeakEvent } from "./solution.js";

const lines: [HomeEvent, string][] = [
  [{ kind: "motion", room: "hallway" }, "motion in the hallway"],
  [{ kind: "door", door: "back", open: false }, "back door closed"],
  [{ kind: "door", door: "garage", open: true }, "garage door opened"],
  [{ kind: "temperature", room: "attic", celsius: -2.5 }, "attic at -2.5 C"],
  [{ kind: "battery", device: "smoke alarm", percent: 15 }, "smoke alarm battery at 15%"],
  [{ kind: "leak", room: "bathroom" }, "LEAK in the bathroom"],
];
for (const [event, line] of lines) {
  check.equal(describe(event), line, `describe() of a ${event.kind} event`);
}

check.throws(
  () => describe({ kind: "smoke", room: "kitchen" } as unknown as HomeEvent),
  "describe() throws for a kind outside the union instead of returning a line",
);

const leak: LeakEvent = { kind: "leak", room: "cellar" };
check.equal(describe(leak), "LEAK in the cellar", "a LeakEvent is a HomeEvent");

function typeChecksOnly(): void {
  // @ts-expect-error a leak event must name its room
  const noRoom: HomeEvent = { kind: "leak" };
  // @ts-expect-error "smoke" is not one of the kinds
  const smoke: HomeEvent["kind"] = "smoke";
  // @ts-expect-error a door event has no room
  const doorInRoom: HomeEvent = { kind: "door", door: "front", open: true, room: "hall" };
}
check.true(typeof typeChecksOnly === "function", "the union has exactly the five kinds");
